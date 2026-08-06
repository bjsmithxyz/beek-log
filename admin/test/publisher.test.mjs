import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PublishError,
  TRAVEL_POLICY,
  createPublication,
  validateOperations,
  validatePublicationInput,
} from '../src/server/publisher.mjs';

process.env.GITHUB_REPOSITORY_OWNER = 'bjsmithxyz';
process.env.GITHUB_REPOSITORY_NAME = 'beek-log';

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

function successfulPublisherFetch({ treeEntries, refStatus = 200, priorCommits = [], blobs = {} } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`;
    const method = options.method || 'GET';
    calls.push({ url, path, method, body: options.body ? JSON.parse(options.body) : null });
    if (parsed.pathname.endsWith('/commits') && parsed.searchParams.get('sha') === 'main') {
      return response(200, priorCommits);
    }
    if (path.endsWith('/commits/main')) return response(200, { sha: A, commit: { tree: { sha: B } } });
    if (path.endsWith(`/git/trees/${B}?recursive=1`)) return response(200, {
      truncated: false,
      tree: treeEntries || [{ path: 'src/data/trips.json', type: 'blob', sha: C }],
    });
    const blobMatch = parsed.pathname.match(/\/git\/blobs\/([0-9a-f]{40})$/);
    if (blobMatch && method === 'GET') {
      const sha = blobMatch[1];
      if (!(sha in blobs)) return response(404, { message: 'Not Found' });
      return response(200, { sha, encoding: 'base64', content: blobs[sha] });
    }
    if (path.endsWith('/git/blobs') && method === 'POST') return response(201, { sha: D });
    if (path.endsWith('/git/trees') && method === 'POST') return response(201, { sha: E });
    if (path.endsWith('/git/commits') && method === 'POST') {
      return response(201, {
        sha: F,
        html_url: `https://github.com/bjsmithxyz/beek-log/commit/${F}`,
      });
    }
    if (path.endsWith('/git/refs/heads/main') && method === 'PATCH') {
      return response(refStatus, { ref: 'refs/heads/main', object: { sha: F } });
    }
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

test('operation validation rejects path traversal segments even when policy is open', () => {
  const open = { ...TRAVEL_POLICY, allows: () => true };
  assert.throws(() => validateOperations([
    { action: 'create', path: 'src/content/photos/../../package.json', content: 'x' },
  ], open), /invalid path/);
  assert.throws(() => validateOperations([
    { action: 'create', path: 'src/./trips.json', content: 'x' },
  ], open), /invalid path/);
});

test('publication schema rejects malformed and unknown input before remote work', () => {
  assert.throws(() => validatePublicationInput({ ...travelInput, unknown: true }, TRAVEL_POLICY), /unknown/);
  assert.throws(() => validatePublicationInput({ ...travelInput, requestId: 'not-a-uuid' }, TRAVEL_POLICY), /request ID/);
  assert.throws(() => validatePublicationInput({
    ...travelInput,
    message: 'Update travel\n\nCo-authored-by: evil <e@e.com>',
  }, TRAVEL_POLICY), /Commit message/);
});

test('generic publisher builds one commit and updates main', async () => {
  const fake = successfulPublisherFetch();
  const publication = await createPublication(travelInput, {
    token: 'token', policy: TRAVEL_POLICY, fetchImpl: fake.fetchImpl,
  });
  assert.equal(publication.commitSha, F);
  assert.equal(publication.htmlUrl, `https://github.com/bjsmithxyz/beek-log/commit/${F}`);
  assert.equal(publication.state, 'committed');
  const sideEffects = fake.calls.filter((call) => call.method !== 'GET');
  assert.deepEqual(sideEffects.map((call) => `${call.method} ${new URL(call.url).pathname.split('/beek-log')[1]}`), [
    'POST /git/trees', 'POST /git/commits', 'PATCH /git/refs/heads/main',
  ]);
  const ref = sideEffects.find((call) => call.path.endsWith('/git/refs/heads/main'));
  assert.equal(ref.body.sha, F);
  assert.equal(ref.body.force, false);
  const commit = sideEffects.find((call) => call.path.endsWith('/git/commits'));
  assert.deepEqual(commit.body.parents, [A]);
});

test('pre-uploaded blob operations reuse their SHA without another blob upload', async () => {
  const fake = successfulPublisherFetch();
  const input = {
    ...travelInput,
    operations: [{
      action: 'update', path: 'src/data/trips.json', expectedSha: C, blobSha: D,
    }],
  };
  await createPublication(input, { token: 'token', policy: TRAVEL_POLICY, fetchImpl: fake.fetchImpl });
  assert.equal(fake.calls.some((call) => call.path.endsWith('/git/blobs')), false);
  const treeCall = fake.calls.find((call) => call.path.endsWith('/git/trees') && call.method === 'POST');
  assert.equal(treeCall.body.tree[0].sha, D);
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

test('tree failure leaves main untouched', async () => {
  const policy = { maxOperations: 2, maxFileBytes: 100, maxTotalBytes: 200, allows: () => true };
  const input = {
    ...travelInput,
    operations: [
      { action: 'update', path: 'a.txt', expectedSha: C, content: 'one' },
      { action: 'create', path: 'b.txt', content: 'two' },
    ],
  };
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`;
    const method = options.method || 'GET';
    calls.push({ path, method });
    if (parsed.pathname.endsWith('/commits') && parsed.searchParams.get('sha') === 'main') {
      return response(200, []);
    }
    if (path.endsWith('/commits/main')) return response(200, { sha: A, commit: { tree: { sha: B } } });
    if (path.endsWith(`/git/trees/${B}?recursive=1`)) return response(200, {
      truncated: false, tree: [{ path: 'a.txt', type: 'blob', sha: C }],
    });
    if (path.endsWith('/git/trees') && method === 'POST') return response(500, { message: 'failed' });
    throw new Error(`Unexpected ${method} ${path}`);
  };
  await assert.rejects(createPublication(input, { token: 'token', policy, fetchImpl }));
  assert.equal(calls.some((call) => call.path.endsWith('/git/refs/heads/main')), false);
});

test('concurrent main update surfaces a stale-base conflict', async () => {
  const fake = successfulPublisherFetch({ refStatus: 422 });
  await assert.rejects(
    createPublication(travelInput, { token: 'token', policy: TRAVEL_POLICY, fetchImpl: fake.fetchImpl }),
    (error) => error.code === 'stale_base' && error.status === 409,
  );
});

test('repeated requestId returns the prior commit without writing again', async () => {
  const fake = successfulPublisherFetch({
    priorCommits: [{
      sha: F,
      html_url: `https://github.com/bjsmithxyz/beek-log/commit/${F}`,
      commit: { message: `Update travel itinerary via admin\n\nBeek-Request-Id: ${requestId}` },
    }],
  });
  const publication = await createPublication(travelInput, {
    token: 'token', policy: TRAVEL_POLICY, fetchImpl: fake.fetchImpl,
  });
  assert.equal(publication.commitSha, F);
  assert.equal(fake.calls.some((call) => call.method !== 'GET'), false);
});

test('jpg blob operations must point at JPEG magic bytes', async () => {
  const policy = {
    maxOperations: 1, maxFileBytes: 100, maxTotalBytes: 100,
    allows: (path) => path.endsWith('.jpg'),
  };
  const input = {
    ...travelInput,
    resource: 'rolls',
    operations: [{ action: 'create', path: 'src/assets/photos/demo/001.jpg', blobSha: D }],
  };
  const textBlob = Buffer.from('not-a-jpeg').toString('base64');
  const fake = successfulPublisherFetch({
    treeEntries: [],
    blobs: { [D]: textBlob },
  });
  await assert.rejects(
    createPublication(input, { token: 'token', policy, fetchImpl: fake.fetchImpl }),
    (error) => error.code === 'invalid_blob',
  );
  assert.equal(fake.calls.some((call) => call.method !== 'GET'), false);

  const jpegBlob = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString('base64');
  const ok = successfulPublisherFetch({
    treeEntries: [],
    blobs: { [D]: jpegBlob },
  });
  const publication = await createPublication(input, { token: 'token', policy, fetchImpl: ok.fetchImpl });
  assert.equal(publication.commitSha, F);
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
  assert.equal(fake.calls.some((call) => call.path.endsWith('/git/refs/heads/main') && call.method === 'PATCH'), true);
});
