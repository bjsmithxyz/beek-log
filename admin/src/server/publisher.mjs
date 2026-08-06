import { env, githubHeaders } from './auth.mjs';

const SHA = /^[0-9a-f]{40}$/;
const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
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

function publicationResult(input, commit) {
  const { owner, repo } = repository();
  return {
    requestId: input.requestId,
    commitSha: commit.sha,
    htmlUrl: commit.html_url || `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    state: 'committed',
  };
}

export async function createPublication(rawInput, {
  token,
  policy,
  fetchImpl = fetch,
} = {}) {
  const input = validatePublicationInput(rawInput, policy);
  const client = createClient(token, fetchImpl);

  // The repository commit endpoint includes both the commit and tree SHAs.
  // Using it avoids a separate ref + Git-commit round trip, which matters on
  // latency-limited serverless publication requests.
  const baseCommit = await client.request(`/commits/${BASE_BRANCH}`);
  const baseSha = baseCommit.sha;
  const baseTreeSha = baseCommit.commit?.tree?.sha;
  if (!SHA.test(baseSha || '') || !SHA.test(baseTreeSha || '')) throw new GitHubError(502);
  const currentTree = await client.request(`/git/trees/${baseTreeSha}?recursive=1`);
  verifyCurrentTree(input.operations, currentTree, policy);

  const entries = [];
  for (const operation of input.operations) {
    if (operation.action === 'delete') {
      entries.push({ path: operation.path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    if (operation.blobSha) {
      entries.push({ path: operation.path, mode: '100644', type: 'blob', sha: operation.blobSha });
    } else {
      // GitHub's create-tree API creates textual blobs from `content` in the
      // same request. Binary image blobs still arrive through storeBytes.
      entries.push({ path: operation.path, mode: '100644', type: 'blob', content: operation.content });
    }
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

  try {
    await client.request(`/git/refs/heads/${BASE_BRANCH}`, {
      method: 'PATCH',
      body: { sha: commit.sha, force: false },
    });
  } catch (error) {
    if (error instanceof GitHubError && (error.status === 409 || error.status === 422)) {
      throw new PublishError(
        'main moved while publishing; reload and try again.',
        { status: 409, code: 'stale_base' },
      );
    }
    throw error;
  }

  return publicationResult(input, commit);
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
