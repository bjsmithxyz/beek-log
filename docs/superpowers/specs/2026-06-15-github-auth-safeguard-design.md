# GitHub auth safeguard for roll-admin

**Date:** 2026-06-15
**Status:** Approved (design)

## Problem

The roll-admin "write + commit + push" button runs `git add` → `git commit` →
`git push` (`gitPublish` in `scripts/admin/publish.mjs`) with no check that
GitHub auth is valid. The push remote is HTTPS, and the credential helper is
`!gh auth git-credential` (from `~/.gitconfig`), so a working push depends
entirely on `gh` holding a valid github.com token.

When that token is missing, invalid, or expired, the sequence fails *after the
commit has already landed*: the working tree is clean but the local branch sits
ahead of `origin/main` with an unpushed commit. This is the orphan-commit hazard
already noted for this tool. It is a live failure mode — at design time
`gh auth status` reports `The token in /home/beek/.config/gh/hosts.yml is
invalid.`

We want a safeguard that (a) surfaces GitHub auth state in the admin UI, and
(b) refuses the commit+push when auth is bad, before anything is written or
committed, so no orphan commit is created.

## Goals

- A persistent auth-status badge in the admin UI (fixed bottom-right).
- A hard gate: when auth is not valid, the commit+push path is blocked both in
  the UI (button disabled) and server-side (authoritative pre-check). No commit,
  no orphan state.
- The "write roll" (files only, no git) path stays available regardless of auth.
- Checks are lazy: on page load and right before each publish, plus a manual
  recheck. No background polling.

## Non-goals

- SSH-remote support. The check targets the actual setup (HTTPS + `gh`
  credential helper). If the remote scheme changes later, the check is revisited.
- Auto-running `gh auth login` from the admin. The badge tells the user to run
  it; it does not run it for them.
- Validating push permission to the specific repo. The check confirms gh holds a
  valid github.com token (what the credential helper hands to git), not
  fine-grained repo write scope.

## Auth-check mechanism

`gh auth status -h github.com`, exit-code based.

- Exit 0 → authed.
- Non-zero with gh present → unauthed (missing / invalid / expired token).
- `gh` binary not found (ENOENT) → `gh-missing`.
- Any other failure (e.g. spawn error) → `error`.

Rationale: push's credential helper *is* `gh auth git-credential`, so "does gh
hold a valid github.com token" is exactly what push needs. `gh auth status` does
a real API validation, so it catches invalid/expired tokens — the live failure.

Rejected alternatives:

- `gh api user` — also validates via real API call, but fetches the whole user
  object for no extra signal over the exit code.
- `gh auth token` (presence only) — no network validation, so it misses the
  invalid/expired-token case, which is precisely the bug we are guarding against.

## Architecture

### `scripts/admin/publish.mjs` — new helper

```
checkGitHubAuth({ run }) -> { ok: boolean, state, detail: string }
```

- `state` ∈ `'authed' | 'unauthed' | 'gh-missing' | 'error'`. `ok === (state === 'authed')`.
- `run` is an injected runner (defaults to the module's `execFile` wrapper),
  mirroring how `writeRollFiles` takes an explicit `repoRoot` for testability.
- Runs `gh auth status -h github.com`. Maps exit 0 → authed; ENOENT → gh-missing;
  other non-zero → unauthed; thrown/spawn errors → error.
- `detail` is a short human string for the badge/log (e.g. `gh not found`,
  `token invalid — run: gh auth login`).

### `scripts/admin/server.mjs` — new route + gate

- `GET /api/auth` → `checkGitHubAuth()` → `200 { ok, state, detail }`.
- In `POST /api/publish`: when `commit` is truthy, call `checkGitHubAuth()`
  **before any file write**. If not `ok`, return `401 { error, authFailed: true }`
  immediately — nothing written, nothing committed. The non-commit ("write roll")
  path is unchanged.

### `scripts/admin/index.html` + `app.js` — badge + button gate

Fixed bottom-right badge. States:

```
● github: authed          (green  — var(--color-accent-primary))
● github: not authed       (red    — #ff6b6b)        ← publish disabled
● github: checking…        (grey   — var(--color-text-muted))
● github: gh not found     (amber)                   ← publish disabled
```

- On page load: `GET /api/auth`, set badge (starts in `checking…`).
- Click badge → manual recheck. No polling.
- When badge state ≠ authed: disable the `write + commit + push` button and show
  the reason (`run: gh auth login`) in the `#log` area / tooltip. `write roll`
  stays enabled.
- Server gate is authoritative: even with a stale badge, the pre-publish recheck
  blocks. A `401 authFailed` response flips the badge to red and writes a red
  error line to `#log`.

## Error handling

The gate blocks unless `ok === true`. `gh-missing` and `error` block as well — a
push would fail anyway, so blocking is the safe default. The badge shows the
reason in each case. There is no silent pass-through.

## Testing

- `checkGitHubAuth` is unit-tested in `scripts/admin/publish.test.mjs`
  (`node --test`) via an injected `run` stub: exit 0 → authed, non-zero →
  unauthed, ENOENT → gh-missing, thrown error → error. No real network.
- Existing `publish.test.mjs` / `lib.test.mjs` behaviour is preserved.

## Files touched

- `scripts/admin/publish.mjs` — add `checkGitHubAuth`.
- `scripts/admin/server.mjs` — add `GET /api/auth`; add auth pre-check to
  `POST /api/publish` commit path.
- `scripts/admin/index.html` — badge markup + CSS.
- `scripts/admin/app.js` — fetch `/api/auth`, render badge, manual recheck,
  disable publish button, handle `401 authFailed`.
- `scripts/admin/publish.test.mjs` — tests for `checkGitHubAuth`.
