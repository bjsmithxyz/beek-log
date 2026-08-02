import crypto from 'node:crypto';
import { env, githubHeaders } from './auth.mjs';

const SHA = /^[0-9a-f]{40}$/;
const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MARKER = '<!-- beek-admin:publication:v1 -->';
const BASE_BRANCH = 'main';

export class PublishError extends Error {
  constructor(message, { status = 400, code = 'publish_error' } = {}) {
    super(message);
    this.name = 'PublishError';
    this.status = status;
    this.code = code;
  }
}

class GitHubError extends Error {
  constructor(status) {
    super(`GitHub request failed (${status})`);
    this.name = 'GitHubError';
    this.status = status;
  }
}

function repository() {
  return {
    owner: env('GITHUB_REPOSITORY_OWNER', 'bjsmithxyz'),
    repo: env('GITHUB_REPOSITORY_NAME', 'beek-log'),
  };
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PublishError(`${label} must be an object.`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new PublishError(`${label} has unknown or missing fields.`);
  }
}

function validUtf8(value) {
  return typeof value === 'string' && Buffer.from(value, 'utf8').toString('utf8') === value;
}

export function validateOperations(operations, policy) {
  if (!Array.isArray(operations) || operations.length === 0 || operations.length > policy.maxOperations) {
    throw new PublishError(`Publication requires 1–${policy.maxOperations} operations.`);
  }
  const paths = new Set();
  let totalBytes = 0;
  return operations.map((operation, index) => {
    const label = `Operation ${index + 1}`;
    if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
      throw new PublishError(`${label} must be an object.`);
    }
    const action = operation.action;
    if (!['create', 'update', 'delete'].includes(action)) {
      throw new PublishError(`${label} has an invalid action.`);
    }
    const usesContent = Object.hasOwn(operation, 'content');
    const usesBlob = Object.hasOwn(operation, 'blobSha');
    if (action !== 'delete' && usesContent === usesBlob) {
      throw new PublishError(`${label} must provide exactly one text content or blob SHA.`);
    }
    const expected = action === 'delete'
      ? ['action', 'path', 'expectedSha']
      : action === 'create'
        ? ['action', 'path', usesBlob ? 'blobSha' : 'content']
        : ['action', 'path', 'expectedSha', usesBlob ? 'blobSha' : 'content'];
    exactKeys(operation, expected, label);

    const path = operation.path;
    if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('\\') || path.includes('\0')) {
      throw new PublishError(`${label} has an invalid path.`);
    }
    if (!policy.allows(path, action)) throw new PublishError(`${label} path is not allowed.`);
    if (paths.has(path)) throw new PublishError(`Duplicate operation path: ${path}`);
    paths.add(path);

    if (action !== 'create' && !SHA.test(operation.expectedSha)) {
      throw new PublishError(`${label} needs a valid expected blob SHA.`);
    }
    if (action !== 'delete' && usesBlob) {
      if (!SHA.test(operation.blobSha || '')) throw new PublishError(`${label} needs a valid blob SHA.`);
    }
    if (action !== 'delete' && usesContent) {
      if (!validUtf8(operation.content)) throw new PublishError(`${label} content must be valid UTF-8 text.`);
      const bytes = Buffer.byteLength(operation.content, 'utf8');
      if (bytes > policy.maxFileBytes) throw new PublishError(`${label} content is too large.`);
      totalBytes += bytes;
    }
    if (totalBytes > policy.maxTotalBytes) throw new PublishError('Publication content is too large.');
    return { ...operation };
  });
}

export const TRAVEL_POLICY = Object.freeze({
  maxOperations: 1,
  maxFileBytes: 256 * 1024,
  maxTotalBytes: 256 * 1024,
  allows(path) {
    return path === 'src/data/trips.json';
  },
});

export function validatePublicationInput(input, policy) {
  exactKeys(input, ['requestId', 'resource', 'title', 'message', 'operations'], 'Publication');
  if (!REQUEST_ID.test(input.requestId)) throw new PublishError('Publication request ID is invalid.');
  if (typeof input.resource !== 'string' || !/^[a-z][a-z0-9-]{1,30}$/.test(input.resource)) {
    throw new PublishError('Publication resource is invalid.');
  }
  if (typeof input.title !== 'string' || input.title.trim().length < 1 || input.title.length > 120) {
    throw new PublishError('Publication title is invalid.');
  }
  if (typeof input.message !== 'string' || input.message.trim().length < 1 || input.message.length > 200) {
    throw new PublishError('Commit message is invalid.');
  }
  return { ...input, operations: validateOperations(input.operations, policy) };
}

function branchFor(input) {
  return `admin/${input.resource}/${input.requestId}`;
}

function previewUrl(number) {
  const host = env('PUBLIC_NETLIFY_HOST', 'beek-log.netlify.app');
  if (!/^[a-z0-9-]+\.netlify\.app$/.test(host)) throw new Error('Invalid preview host configuration');
  return `https://deploy-preview-${number}--${host}`;
}

function publicationFromPull(pull, branch, requestId) {
  return {
    requestId,
    number: pull.number,
    branch,
    headSha: pull.head.sha,
    prUrl: pull.html_url,
    previewUrl: previewUrl(pull.number),
    state: pull.merged_at ? 'merged' : pull.state === 'closed' ? 'closed' : 'preview_pending',
  };
}

function createClient(token, fetchImpl) {
  const { owner, repo } = repository();
  const root = `https://api.github.com/repos/${owner}/${repo}`;
  return {
    owner,
    repo,
    async request(path, { method = 'GET', body, allow404 = false } = {}) {
      const response = await fetchImpl(`${root}${path}`, {
        method,
        headers: {
          ...githubHeaders(token),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (allow404 && response.status === 404) return null;
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new GitHubError(response.status);
      return data;
    },
  };
}

async function existingPublication(client, branch, requestId) {
  const ref = await client.request(`/git/ref/heads/${branch}`, { allow404: true });
  if (!ref) return null;
  const pulls = await client.request(`/pulls?state=all&head=${encodeURIComponent(`${client.owner}:${branch}`)}`);
  const pull = pulls.find((candidate) => candidate.body?.includes(MARKER));
  if (pull) return publicationFromPull(validatePublicationPull(pull), branch, requestId);
  throw new PublishError('That publication request already exists.', { status: 409, code: 'request_conflict' });
}

function verifyCurrentTree(operations, tree, policy) {
  if (tree.truncated) throw new PublishError('Repository tree is too large to verify safely.', { status: 409, code: 'tree_truncated' });
  const blobs = new Map(tree.tree.filter((entry) => entry.type === 'blob').map((entry) => [entry.path, entry.sha]));
  if (policy.verifyCurrent) policy.verifyCurrent(blobs);
  for (const operation of operations) {
    const current = blobs.get(operation.path);
    if (operation.action === 'create' && current) {
      throw new PublishError(`File already exists: ${operation.path}`, { status: 409, code: 'stale_content' });
    }
    if (operation.action !== 'create' && current !== operation.expectedSha) {
      throw new PublishError(`File changed since it was loaded: ${operation.path}`, { status: 409, code: 'stale_content' });
    }
  }
}

export async function createPublication(rawInput, {
  token,
  policy,
  fetchImpl = fetch,
} = {}) {
  const input = validatePublicationInput(rawInput, policy);
  const client = createClient(token, fetchImpl);
  const branch = branchFor(input);
  const existing = await existingPublication(client, branch, input.requestId);
  if (existing) return { ...existing, resumed: true };

  const baseRef = await client.request(`/git/ref/heads/${BASE_BRANCH}`);
  const baseSha = baseRef.object?.sha;
  if (!SHA.test(baseSha || '')) throw new GitHubError(502);
  const baseCommit = await client.request(`/git/commits/${baseSha}`);
  const baseTreeSha = baseCommit.tree?.sha;
  if (!SHA.test(baseTreeSha || '')) throw new GitHubError(502);
  const currentTree = await client.request(`/git/trees/${baseTreeSha}?recursive=1`);
  verifyCurrentTree(input.operations, currentTree, policy);

  const entries = [];
  for (const operation of input.operations) {
    if (operation.action === 'delete') {
      entries.push({ path: operation.path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    let blobSha = operation.blobSha;
    if (!blobSha) {
      const blob = await client.request('/git/blobs', {
        method: 'POST', body: { content: operation.content, encoding: 'utf-8' },
      });
      if (!SHA.test(blob.sha || '')) throw new GitHubError(502);
      blobSha = blob.sha;
    }
    entries.push({ path: operation.path, mode: '100644', type: 'blob', sha: blobSha });
  }

  const newTree = await client.request('/git/trees', {
    method: 'POST', body: { base_tree: baseTreeSha, tree: entries },
  });
  const commit = await client.request('/git/commits', {
    method: 'POST',
    body: {
      message: `${input.message}\n\nBeek-Request-Id: ${input.requestId}`,
      tree: newTree.sha,
      parents: [baseSha],
    },
  });

  let branchCreated = false;
  try {
    await client.request('/git/refs', {
      method: 'POST', body: { ref: `refs/heads/${branch}`, sha: commit.sha },
    });
    branchCreated = true;
    const pull = await client.request('/pulls', {
      method: 'POST',
      body: {
        title: input.title,
        head: branch,
        base: BASE_BRANCH,
        body: `${MARKER}\n\nCreated by the authenticated admin. Review the Deploy Preview before merging.\n\nRequest: \`${input.requestId}\``,
      },
    });
    return publicationFromPull(pull, branch, input.requestId);
  } catch (error) {
    if (branchCreated) {
      await client.request(`/git/refs/heads/${branch}`, { method: 'DELETE' }).catch(() => {});
    }
    throw error;
  }
}

function validatePublicationPull(pull) {
  const { owner, repo } = repository();
  if (!pull || pull.base?.ref !== BASE_BRANCH || !pull.head?.ref?.startsWith('admin/') ||
      pull.head?.repo?.full_name !== `${owner}/${repo}` || !pull.body?.includes(MARKER)) {
    throw new PublishError('Pull request is not an admin publication.', { status: 403, code: 'invalid_publication' });
  }
  return pull;
}

function validNumber(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new PublishError('Pull request number is invalid.');
  return number;
}

export function validateControlInput(input) {
  exactKeys(input, ['number', 'headSha'], 'Publication control request');
  const number = validNumber(input.number);
  if (!SHA.test(input.headSha || '')) throw new PublishError('Publication head SHA is invalid.');
  return { number, headSha: input.headSha };
}

async function previewReady(url, fetchImpl) {
  try {
    const response = await fetchImpl(url, { method: 'HEAD', redirect: 'manual' });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

export async function publicationStatus(numberValue, { token, fetchImpl = fetch } = {}) {
  const number = validNumber(numberValue);
  const client = createClient(token, fetchImpl);
  const pull = validatePublicationPull(await client.request(`/pulls/${number}`));
  const url = previewUrl(number);
  const ready = pull.state === 'open' && await previewReady(url, fetchImpl);
  return {
    number,
    branch: pull.head.ref,
    headSha: pull.head.sha,
    prUrl: pull.html_url,
    previewUrl: url,
    preview: ready ? 'ready' : pull.state === 'open' ? 'pending' : 'unavailable',
    state: pull.merged_at ? 'merged' : pull.state,
    mergeable: pull.mergeable,
  };
}

function assertHeadSha(value, pull) {
  if (!SHA.test(value || '') || value !== pull.head.sha) {
    throw new PublishError('Publication changed; reload its status.', { status: 409, code: 'stale_publication' });
  }
}

export async function mergePublication(numberValue, headSha, { token, fetchImpl = fetch } = {}) {
  const number = validNumber(numberValue);
  const client = createClient(token, fetchImpl);
  const pull = validatePublicationPull(await client.request(`/pulls/${number}`));
  if (pull.state !== 'open') throw new PublishError('Publication is not open.', { status: 409, code: 'not_open' });
  assertHeadSha(headSha, pull);
  if (pull.mergeable !== true) {
    throw new PublishError('Pull request is not currently mergeable.', { status: 409, code: 'not_mergeable' });
  }
  const url = previewUrl(number);
  if (!await previewReady(url, fetchImpl)) {
    throw new PublishError('Deploy Preview is not ready.', { status: 409, code: 'preview_pending' });
  }
  const merged = await client.request(`/pulls/${number}/merge`, {
    method: 'PUT',
    body: { sha: headSha, merge_method: 'squash', commit_title: pull.title },
  });
  if (!merged.merged) throw new PublishError('GitHub could not merge the publication.', { status: 409, code: 'merge_failed' });
  await client.request(`/git/refs/heads/${pull.head.ref}`, { method: 'DELETE' }).catch(() => {});
  return { number, merged: true, message: merged.message || 'Merged' };
}

export async function abandonPublication(numberValue, headSha, { token, fetchImpl = fetch } = {}) {
  const number = validNumber(numberValue);
  const client = createClient(token, fetchImpl);
  const pull = validatePublicationPull(await client.request(`/pulls/${number}`));
  if (pull.state !== 'open') throw new PublishError('Publication is not open.', { status: 409, code: 'not_open' });
  assertHeadSha(headSha, pull);
  await client.request(`/pulls/${number}`, { method: 'PATCH', body: { state: 'closed' } });
  await client.request(`/git/refs/heads/${pull.head.ref}`, { method: 'DELETE' }).catch(() => {});
  return { number, abandoned: true };
}

export function publicationErrorResponse(error) {
  if (error instanceof PublishError) {
    return { status: error.status, body: { ok: false, error: error.message, code: error.code } };
  }
  if (error instanceof GitHubError) {
    const status = error.status === 409 || error.status === 422 ? 409 : 502;
    return { status, body: { ok: false, error: 'GitHub could not complete the publication.', code: 'github_error' } };
  }
  return { status: 500, body: { ok: false, error: 'Publication failed safely.', code: 'server_error' } };
}

export function newRequestId() {
  return crypto.randomUUID();
}
