# GitHub Auth Safeguard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make roll-admin show GitHub auth state and refuse "write + commit + push" when `gh` lacks a valid github.com token, preventing the orphan local-commit-without-push state.

**Architecture:** A pure-ish `checkGitHubAuth` helper in `publish.mjs` runs `gh auth status -h github.com` (the credential the HTTPS push helper hands to git) and classifies the result. `server.mjs` exposes it at `GET /api/auth` and calls it as a pre-check at the top of the commit path in `POST /api/publish`, before any file write. The admin page shows a fixed bottom-right badge that fetches `/api/auth` on load and on click, and disables the publish button unless state is `authed`.

**Tech Stack:** Node 22 (`node:http`, `node:child_process`), `node --test`, vanilla browser JS/HTML/CSS. No new dependencies.

**Repo conventions:** Commit messages are imperative and capitalized, no `type:` prefix (e.g. "Reset roll-admin form to defaults"). Tests run with `npm test` (`node --test`).

---

### Task 1: `checkGitHubAuth` helper (publish.mjs)

**Files:**
- Modify: `scripts/admin/publish.mjs` (add export; `exec`/`execFile` already imported at top)
- Test: `scripts/admin/publish.test.mjs` (add cases; extend the `writeRollFiles` import)

- [ ] **Step 1: Write the failing tests**

Add to the top import in `scripts/admin/publish.test.mjs`, changing:

```js
import { writeRollFiles } from './publish.mjs';
```

to:

```js
import { writeRollFiles, checkGitHubAuth } from './publish.mjs';
```

Then append these tests to the end of `scripts/admin/publish.test.mjs`:

```js
// checkGitHubAuth classifies the result of the injected `run` (which mirrors
// node execFile semantics: resolves on exit 0, rejects otherwise with err.code
// = exit number, or 'ENOENT' when the gh binary is missing).
test('checkGitHubAuth: run resolves (exit 0) → authed', async () => {
  const r = await checkGitHubAuth({ run: async () => ({ stdout: '', stderr: 'Logged in' }) });
  assert.equal(r.ok, true);
  assert.equal(r.state, 'authed');
});

test('checkGitHubAuth: non-zero exit → unauthed', async () => {
  const r = await checkGitHubAuth({
    run: async () => { const e = new Error('exit 1'); e.code = 1; throw e; },
  });
  assert.equal(r.ok, false);
  assert.equal(r.state, 'unauthed');
});

test('checkGitHubAuth: ENOENT (gh not installed) → gh-missing', async () => {
  const r = await checkGitHubAuth({
    run: async () => { const e = new Error('spawn gh ENOENT'); e.code = 'ENOENT'; throw e; },
  });
  assert.equal(r.ok, false);
  assert.equal(r.state, 'gh-missing');
});

test('checkGitHubAuth: other failure → error', async () => {
  const r = await checkGitHubAuth({
    run: async () => { throw new Error('weird'); },
  });
  assert.equal(r.ok, false);
  assert.equal(r.state, 'error');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — the new tests error with `checkGitHubAuth is not a function` (or an export error), existing `writeRollFiles` tests still pass.

- [ ] **Step 3: Implement `checkGitHubAuth`**

In `scripts/admin/publish.mjs`, append this export at the end of the file (after `gitPublish`). `exec` (a promisified `execFile`) already exists at the top of the file:

```js
// Probes whether `gh` holds a valid github.com token — the credential the HTTPS
// push helper (`gh auth git-credential`) hands to git. Returns { ok, state,
// detail }; state ∈ 'authed' | 'unauthed' | 'gh-missing' | 'error'. `run` is
// injectable for tests and must mirror node execFile semantics: resolve on exit
// 0, reject otherwise (err.code = exit number, or 'ENOENT' if gh is missing).
export async function checkGitHubAuth({
  run = () => exec('gh', ['auth', 'status', '-h', 'github.com']),
} = {}) {
  try {
    await run();
    return { ok: true, state: 'authed', detail: 'authenticated to github.com' };
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return { ok: false, state: 'gh-missing', detail: 'gh not installed — install GitHub CLI' };
    }
    if (err && typeof err.code === 'number') {
      return { ok: false, state: 'unauthed', detail: 'not authed — run: gh auth login' };
    }
    return { ok: false, state: 'error', detail: `auth check failed: ${(err && err.message) || err}` };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all four `checkGitHubAuth` tests pass; `writeRollFiles` tests still pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/admin/publish.mjs scripts/admin/publish.test.mjs
git commit -m "Add checkGitHubAuth helper for roll-admin"
```

---

### Task 2: `/api/auth` route + publish auth gate (server.mjs)

**Files:**
- Modify: `scripts/admin/server.mjs:11` (import), add a route near the other `/api/*` routes, add the gate inside `POST /api/publish`

- [ ] **Step 1: Extend the publish.mjs import**

In `scripts/admin/server.mjs`, change line 11:

```js
import { writeRollFiles, gitPublish } from './publish.mjs';
```

to:

```js
import { writeRollFiles, gitPublish, checkGitHubAuth } from './publish.mjs';
```

- [ ] **Step 2: Add the `GET /api/auth` route**

In `scripts/admin/server.mjs`, add this route immediately after the `GET /api/config` route (the block ending at line 47):

```js
route('GET', /^\/api\/auth$/, async (req, res) => {
  send(res, 200, await checkGitHubAuth());
});
```

- [ ] **Step 3: Add the auth gate to `POST /api/publish`**

In `scripts/admin/server.mjs`, inside the `POST /api/publish` handler, find the overwrite-guard block that ends with:

```js
  if (targetExists && !(isEdit && sourceSlug === slug)) {
    return send(res, 409, { error: `roll "${slug}" already exists — choose a different slug, or edit that roll directly` });
  }
```

Immediately AFTER that block (and before `const log = [];`), insert:

```js
  // Auth gate: a commit needs a valid github.com token, or the push fails after
  // the commit has already landed (orphan local commit). Check before writing
  // anything so a failed auth leaves the working tree untouched.
  if (commit) {
    const auth = await checkGitHubAuth();
    if (!auth.ok) {
      return send(res, 401, { error: `GitHub ${auth.detail}`, authFailed: true });
    }
  }
```

- [ ] **Step 4: Verify the route by hand**

Start the admin server in one terminal:

Run: `npm run admin`
Expected: `admin → http://127.0.0.1:4322  (Ctrl-C to stop)`

In another terminal:

Run: `curl -s http://127.0.0.1:4322/api/auth`
Expected (auth currently invalid in this environment): JSON `{"ok":false,"state":"unauthed","detail":"not authed — run: gh auth login"}` — or `{"ok":true,"state":"authed",...}` if you have re-run `gh auth login`. Confirm the shape matches `{ ok, state, detail }`.

- [ ] **Step 5: Verify the gate blocks a commit when unauthed**

With `gh auth status -h github.com` currently failing (the live state), POST a minimal commit request and confirm it is refused **without writing files**:

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:4322/api/publish \
  -H 'content-type: application/json' \
  -d '{"commit":true,"slug":"zzz-auth-gate-probe","stock":"kodak-portra-400","date":"2026-06-15","location":{"name":"x","lat":1,"lng":2},"frames":[{"srcPath":"/nonexistent.jpg","alt":"a"}]}'
```
Expected: `401`.

Then confirm nothing was written (the gate runs before any file write):

Run: `ls src/assets/photos/zzz-auth-gate-probe src/content/photos/zzz-auth-gate-probe.md 2>&1`
Expected: both report "No such file or directory" — no orphan files.

Stop the server (Ctrl-C) when done.

- [ ] **Step 6: Run the test suite (no regressions)**

Run: `npm test`
Expected: PASS — all tests green.

- [ ] **Step 7: Commit**

```bash
git add scripts/admin/server.mjs
git commit -m "Gate roll-admin commit+push on GitHub auth; add /api/auth route"
```

---

### Task 3: Auth badge + publish-button gate (index.html, app.js)

**Files:**
- Modify: `scripts/admin/index.html` (badge CSS in the `<style>` block; badge markup before `<script src="/app.js">`)
- Modify: `scripts/admin/app.js` (badge state + fetch; rework the `doPublish` `finally`)

- [ ] **Step 1: Add badge CSS**

In `scripts/admin/index.html`, inside the `<style>` block, add after the `.chip` rule (the last style rule, just before `</style>`):

```css
    .gh-badge { position: fixed; bottom: 1rem; right: 1rem; z-index: 1100;
      font-size: var(--font-size-xs); padding: .35rem .6rem; cursor: pointer;
      background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      user-select: none; }
    .gh-badge.authed { color: var(--color-accent-primary); border-color: var(--color-accent-primary); }
    .gh-badge.unauthed, .gh-badge.error { color: #ff6b6b; border-color: #ff6b6b; }
    .gh-badge.gh-missing { color: #e0a020; border-color: #e0a020; }
    .gh-badge.checking { color: var(--color-text-muted); }
```

- [ ] **Step 2: Add badge markup**

In `scripts/admin/index.html`, add this line immediately before `<script src="/app.js" type="module"></script>`:

```html
  <div id="gh-badge" class="gh-badge checking" title="click to recheck GitHub auth">● github: checking…</div>
```

- [ ] **Step 3: Add badge logic to app.js**

In `scripts/admin/app.js`, add this block immediately after the logging helpers (after the `clearLog` function on line 26, before the `(async () => {` config IIFE):

```js
// ---- GitHub auth badge ------------------------------------------------------
// Badge text is keyed by state (server `detail` is used as the tooltip/hint).
// Publish is enabled only when state === 'authed'; the server re-checks on
// commit, so a stale badge can't let an unauthed push through.
const BADGE_LABEL = {
  checking: 'github: checking…',
  authed: 'github: authed',
  unauthed: 'github: not authed',
  'gh-missing': 'github: gh not found',
  error: 'github: check failed',
};
function setAuthBadge(state, detail) {
  const el = $('gh-badge');
  el.className = 'gh-badge ' + state;
  el.textContent = '● ' + (BADGE_LABEL[state] || 'github: ?');
  el.title = detail || 'click to recheck GitHub auth';
  $('publish').disabled = state !== 'authed';
}
async function refreshAuthBadge() {
  setAuthBadge('checking', 'checking GitHub auth…');
  try {
    const a = await api('/api/auth');
    setAuthBadge(a.state, a.detail);
  } catch (e) {
    setAuthBadge('error', 'auth check failed: ' + e.message);
  }
}
$('gh-badge').onclick = refreshAuthBadge;
refreshAuthBadge();
```

- [ ] **Step 4: Rework `doPublish`'s `finally` so it respects auth state**

In `scripts/admin/app.js`, in the `doPublish` function, replace the `finally` block:

```js
  } finally {
    $('write').disabled = false;
    $('publish').disabled = false;
  }
```

with:

```js
  } finally {
    $('write').disabled = false;
    refreshAuthBadge(); // re-derives the publish button's enabled state from /api/auth
  }
```

(This also flips the badge red after a server `401 authFailed`, since the gate's rejection means `/api/auth` now reports unauthed.)

- [ ] **Step 5: Verify in the browser**

Run: `npm run admin`
Then open `http://127.0.0.1:4322` and check:

Expected (with `gh auth status -h github.com` currently failing):
- Bottom-right badge reads `● github: not authed` in red.
- The `write + commit + push` button is disabled (greyed); hovering the badge shows `not authed — run: gh auth login`.
- The `write roll` button is still enabled.
- Clicking the badge re-runs the check (briefly shows `github: checking…`).

Then, in a terminal, authenticate and recheck:

Run: `gh auth login` (follow prompts) — then click the badge in the browser.
Expected: badge flips to green `● github: authed`; the publish button becomes enabled.

Stop the server (Ctrl-C) when done.

- [ ] **Step 6: Run the test suite (no regressions)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/admin/index.html scripts/admin/app.js
git commit -m "Add GitHub auth badge to roll-admin; gate publish button on auth"
```

---

### Task 4: Update docs

**Files:**
- Modify: `README.md` (admin section, if present) — note the auth safeguard

- [ ] **Step 1: Check whether the README documents the admin tool**

Run: `grep -n -i "admin" README.md`
Expected: shows the admin lines if documented. If there is no admin section, SKIP this task (nothing to update) and proceed to handoff.

- [ ] **Step 2: Add a one-line note (only if an admin section exists)**

In the admin section of `README.md`, add a sentence noting: the admin shows a GitHub auth badge (bottom-right) and the "write + commit + push" action is blocked unless `gh` is authenticated (`gh auth login`). Match the surrounding prose style.

- [ ] **Step 3: Commit (only if the README changed)**

```bash
git add README.md
git commit -m "Document roll-admin GitHub auth safeguard"
```

---

## Self-Review

**Spec coverage:**
- Auth-check via `gh auth status -h github.com`, exit-code based → Task 1.
- `checkGitHubAuth` helper with injected `run`, four states, unit tests → Task 1.
- `GET /api/auth` route → Task 2.
- Server-side pre-publish gate before any file write, `401 authFailed` → Task 2 (steps 3, 5).
- Bottom-right badge, four visible states, on-load fetch + manual recheck click, no polling → Task 3 (steps 1–3).
- Publish button disabled unless authed; `write roll` unaffected → Task 3 (`setAuthBadge`, verified step 5).
- Badge flips red after a server-side block → Task 3 (step 4).
- Gate blocks unless `ok === true` (covers gh-missing / error) → Task 3 `state !== 'authed'` + Task 2 `if (!auth.ok)`.

**Type/name consistency:** `checkGitHubAuth` shape `{ ok, state, detail }` is identical across Task 1 (definition), Task 2 (route + gate), Task 3 (badge). `state` values `authed | unauthed | gh-missing | error` match between the helper, the CSS class names, and `BADGE_LABEL` keys (plus the client-only `checking`).

**Placeholder scan:** No TBD/TODO; every code step shows complete code; Task 4 is conditional with an explicit skip path.
