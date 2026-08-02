import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PublishError,
  TRAVEL_POLICY,
  abandonPublication,
  createPublication,
  mergePublication,
  publicationStatus,
  validateControlInput,
  validateOperations,
  validatePublicationInput,
} from '../src/server/publisher.mjs';

process.env.GITHUB_REPOSITORY_OWNER = 'bjsmithxyz';
process.env.GITHUB_REPOSITORY_NAME = 'beek-log';
process.env.PUBLIC_NETLIFY_HOST = 'beek-log.netlify.app';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const C = 'c'.repeat(40);
const D = 'd'.repeat(40);
const E = 'e'.repeat(40);
const F = 'f'.repeat(40);
const requestId = '123e4567-e89b-42d3-a456-426614174000';
const travelInput = {
  requestId,
  resource: 'travel',
  title: 'Update travel itinerary',
  message: 'Update travel itinerary via admin',
  operations: [{
    action: 'update', path: 'src/data/trips.json', expectedSha: C, content: '{"ok":true}\n',
  }],
};

const response = (status, body = {}) => new Response(
  status === 204 ? null : JSON.stringify(body),
  { status, headers: { 'Content-Type': 'application/json' } },
);

function successfulPublisherFetch({ treeEntries, pullOverrides = {}, pullStatus = 201 } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`;
    const method = options.method || 'GET';
    calls.push({ url, path, method, body: options.body ? JSON.parse(options.body) : null });
    if (path.includes('/git/ref/heads/admin/') && method === 'GET') return response(404);
    if (path.includes('/git/refs/heads/admin/') && method === 'DELETE') return response(204);
    if (path.endsWith('/git/ref/heads/main')) return response(200, { object: { sha: A } });
    if (path.endsWith(`/git/commits/${A}`)) return response(200, { tree: { sha: B } });
    if (path.endsWith(`/git/trees/${B}?recursive=1`)) return response(200, {
      truncated: false,
      tree: treeEntries || [{ path: 'src/data/trips.json', type: 'blob', sha: C }],
    });
    if (path.endsWith('/git/blobs') && method === 'POST') return response(201, { sha: D });
    if (path.endsWith('/git/trees') && method === 'POST') return response(201, { sha: E });
    if (path.endsWith('/git/commits') && method === 'POST') return response(201, { sha: F });
    if (path.endsWith('/git/refs') && method === 'POST') return response(201, { ref: `refs/heads/admin/travel/${requestId}` });
    if (path.endsWith('/pulls') && method === 'POST') return response(pullStatus, {
      number: 42,
      html_url: 'https://github.com/bjsmithxyz/beek-log/pull/42',
      body: '<!-- beek-admin:publication:v1 -->',
      state: 'open', merged_at: null,
      head: { sha: F, ref: `admin/travel/${requestId}` },
      ...pullOverrides,
    });
    throw new Error(`Unexpected request: ${method} ${path}`);
  };
  return { calls, fetchImpl };
}

test('operation validation rejects unknown fields, duplicate paths and forbidden paths', () => {
  assert.throws(() => validateOperations([
    { ...travelInput.operations[0], extra: true },
  ], TRAVEL_POLICY), PublishError);
  assert.throws(() => validateOperations([
    travelInput.operations[0], travelInput.operations[0],
  ], { ...TRAVEL_POLICY, maxOperations: 2 }), /Duplicate/);
  assert.throws(() => validateOperations([
    { action: 'create', path: 'README.md', content: 'bad' },
  ], TRAVEL_POLICY), /not allowed/);
});

test('publication and control schemas reject malformed and unknown input before remote work', () => {
  assert.throws(() => validatePublicationInput({ ...travelInput, unknown: true }, TRAVEL_POLICY), /unknown/);
  assert.throws(() => validatePublicationInput({ ...travelInput, requestId: 'not-a-uuid' }, TRAVEL_POLICY), /request ID/);
  assert.throws(() => validateControlInput({ number: 1, headSha: A, extra: true }), /unknown/);
  assert.throws(() => validateControlInput({ number: 0, headSha: A }), /number/);
});

test('generic publisher builds one commit and PR without updating main', async () => {
  const fake = successfulPublisherFetch();
  const publication = await createPublication(travelInput, {
    token: 'token', policy: TRAVEL_POLICY, fetchImpl: fake.fetchImpl,
  });
  assert.equal(publication.number, 42);
  assert.equal(publication.previewUrl, 'https://deploy-preview-42--beek-log.netlify.app');
  const sideEffects = fake.calls.filter((call) => call.method !== 'GET');
  assert.deepEqual(sideEffects.map((call) => `${call.method} ${new URL(call.url).pathname.split('/beek-log')[1]}`), [
    'POST /git/blobs', 'POST /git/trees', 'POST /git/commits', 'POST /git/refs', 'POST /pulls',
  ]);
  assert.equal(sideEffects.some((call) => call.path.includes('/refs/heads/main')), false);
  const ref = sideEffects.find((call) => call.path.endsWith('/git/refs'));
  assert.equal(ref.body.ref, `refs/heads/admin/travel/${requestId}`);
  const commit = sideEffects.find((call) => call.path.endsWith('/git/commits'));
  assert.deepEqual(commit.body.parents, [A]);
});

test('retrying an existing request resumes its marked pull request without writes', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const path = `${new URL(url).pathname}${new URL(url).search}`;
    const method = options.method || 'GET';
    calls.push({ path, method });
    if (path.includes('/git/ref/heads/admin/')) return response(200, { object: { sha: F } });
    if (path.includes('/pulls?state=all')) return response(200, [pull()]);
    throw new Error(`Unexpected ${method} ${path}`);
  };
  const result = await createPublication(travelInput, { token: 'token', policy: TRAVEL_POLICY, fetchImpl });
  assert.equal(result.resumed, true);
  assert.equal(result.number, 42);
  assert.equal(calls.every((call) => call.method === 'GET'), true);
});

test('stale expected SHA fails before any GitHub write', async () => {
  const fake = successfulPublisherFetch({
    treeEntries: [{ path: 'src/data/trips.json', type: 'blob', sha: D }],
  });
  await assert.rejects(
    createPublication(travelInput, { token: 'token', policy: TRAVEL_POLICY, fetchImpl: fake.fetchImpl }),
    (error) => error.code === 'stale_content' && error.status === 409,
  );
  assert.equal(fake.calls.some((call) => call.method !== 'GET'), false);
});

test('failed PR creation removes its publishing branch and leaves main untouched', async () => {
  const fake = successfulPublisherFetch({ pullStatus: 500 });
  await assert.rejects(
    createPublication(travelInput, { token: 'token', policy: TRAVEL_POLICY, fetchImpl: fake.fetchImpl }),
  );
  const deletes = fake.calls.filter((call) => call.method === 'DELETE');
  assert.equal(deletes.length, 1);
  assert.match(deletes[0].path, /\/git\/refs\/heads\/admin\/travel\//);
  assert.equal(fake.calls.some((call) => call.path.endsWith('/heads/main') && call.method !== 'GET'), false);
});

test('tree construction supports create, update and delete atomically', async () => {
  const policy = {
    maxOperations: 3, maxFileBytes: 100, maxTotalBytes: 300,
    allows: (path) => path.startsWith('allowed/'),
  };
  const input = {
    ...travelInput,
    resource: 'files',
    operations: [
      { action: 'create', path: 'allowed/new.txt', content: 'new' },
      { action: 'update', path: 'allowed/edit.txt', expectedSha: C, content: 'edit' },
      { action: 'delete', path: 'allowed/delete.txt', expectedSha: D },
    ],
  };
  const fake = successfulPublisherFetch({ treeEntries: [
    { path: 'allowed/edit.txt', type: 'blob', sha: C },
    { path: 'allowed/delete.txt', type: 'blob', sha: D },
  ] });
  await createPublication(input, { token: 'token', policy, fetchImpl: fake.fetchImpl });
  const treeCall = fake.calls.find((call) => call.path.endsWith('/git/trees') && call.method === 'POST');
  assert.equal(treeCall.body.tree.length, 3);
  assert.deepEqual(treeCall.body.tree[2], {
    path: 'allowed/delete.txt', mode: '100644', type: 'blob', sha: null,
  });
  assert.equal(fake.calls.filter((call) => call.path.endsWith('/git/commits') && call.method === 'POST').length, 1);
});

function pull({ state = 'open', mergedAt = null, mergeable = true } = {}) {
  return {
    number: 42, title: 'Update travel itinerary', state, merged_at: mergedAt, mergeable,
    html_url: 'https://github.com/bjsmithxyz/beek-log/pull/42',
    body: '<!-- beek-admin:publication:v1 -->',
    base: { ref: 'main' },
    head: {
      ref: `admin/travel/${requestId}`, sha: F,
      repo: { full_name: 'bjsmithxyz/beek-log' },
    },
  };
}

test('status surfaces a Deploy Preview only after it responds', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, method: options.method || 'GET' });
    if (url.startsWith('https://api.github.com/')) return response(200, pull());
    assert.equal(url, 'https://deploy-preview-42--beek-log.netlify.app');
    return new Response(null, { status: 200 });
  };
  const status = await publicationStatus(42, { token: 'token', fetchImpl });
  assert.equal(status.preview, 'ready');
  assert.equal(calls.at(-1).method, 'HEAD');
});

test('merge requires the exact head and a ready preview, then uses the PR merge API', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const method = options.method || 'GET';
    const path = new URL(url).pathname;
    calls.push({ url, method, body: options.body ? JSON.parse(options.body) : null });
    if (url.startsWith('https://deploy-preview-')) return new Response(null, { status: 200 });
    if (path.endsWith('/pulls/42') && method === 'GET') return response(200, pull());
    if (path.endsWith('/pulls/42/merge') && method === 'PUT') return response(200, { merged: true, message: 'ok' });
    if (path.includes('/git/refs/heads/admin/') && method === 'DELETE') return response(204);
    throw new Error(`Unexpected ${method} ${url}`);
  };
  await assert.rejects(
    mergePublication(42, A, { token: 'token', fetchImpl }),
    (error) => error.code === 'stale_publication',
  );
  assert.equal(calls.some((call) => call.method === 'PUT'), false);
  calls.length = 0;
  const merged = await mergePublication(42, F, { token: 'token', fetchImpl });
  assert.equal(merged.merged, true);
  const mergeCall = calls.find((call) => call.method === 'PUT');
  assert.equal(mergeCall.body.sha, F);
  assert.equal(mergeCall.body.merge_method, 'squash');
});

test('merge refuses a conflicting pull request before checking the preview', async () => {
  let previewChecks = 0;
  const fetchImpl = async (url) => {
    if (url.startsWith('https://api.github.com/')) return response(200, pull({ mergeable: false }));
    previewChecks += 1;
    return new Response(null, { status: 200 });
  };
  await assert.rejects(
    mergePublication(42, F, { token: 'token', fetchImpl }),
    (error) => error.code === 'not_mergeable',
  );
  assert.equal(previewChecks, 0);
});

test('abandon closes the PR and deletes only its admin branch', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const method = options.method || 'GET';
    const path = new URL(url).pathname;
    calls.push({ path, method, body: options.body ? JSON.parse(options.body) : null });
    if (path.endsWith('/pulls/42') && method === 'GET') return response(200, pull());
    if (path.endsWith('/pulls/42') && method === 'PATCH') return response(200, { ...pull(), state: 'closed' });
    if (path.includes('/git/refs/heads/admin/') && method === 'DELETE') return response(204);
    throw new Error(`Unexpected ${method} ${url}`);
  };
  const result = await abandonPublication(42, F, { token: 'token', fetchImpl });
  assert.equal(result.abandoned, true);
  assert.deepEqual(calls.filter((call) => call.method !== 'GET').map((call) => call.method), ['PATCH', 'DELETE']);
  assert.equal(calls.some((call) => call.path.endsWith('/heads/main')), false);
});
