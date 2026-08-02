import { env, githubHeaders } from './auth.mjs';

class RepositoryReadError extends Error {}

function config() {
  return {
    owner: env('GITHUB_REPOSITORY_OWNER', 'bjsmithxyz'),
    repo: env('GITHUB_REPOSITORY_NAME', 'beek-log'),
  };
}

async function request(path, token, fetchImpl) {
  const { owner, repo } = config();
  const response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    headers: githubHeaders(token),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new RepositoryReadError(`Repository read failed (${response.status})`);
  return body;
}

export async function readMainTree(token, fetchImpl = fetch) {
  const ref = await request('/git/ref/heads/main', token, fetchImpl);
  const commitSha = ref.object?.sha;
  if (!/^[0-9a-f]{40}$/.test(commitSha || '')) throw new RepositoryReadError('Invalid main reference');
  const commit = await request(`/git/commits/${commitSha}`, token, fetchImpl);
  const treeSha = commit.tree?.sha;
  if (!/^[0-9a-f]{40}$/.test(treeSha || '')) throw new RepositoryReadError('Invalid main tree');
  const tree = await request(`/git/trees/${treeSha}?recursive=1`, token, fetchImpl);
  if (tree.truncated || !Array.isArray(tree.tree)) throw new RepositoryReadError('Repository tree cannot be verified');
  return { commitSha, entries: tree.tree };
}

export async function readTextBlob(sha, token, fetchImpl = fetch) {
  if (!/^[0-9a-f]{40}$/.test(sha || '')) throw new RepositoryReadError('Invalid blob SHA');
  const blob = await request(`/git/blobs/${sha}`, token, fetchImpl);
  if (blob.encoding !== 'base64' || typeof blob.content !== 'string') throw new RepositoryReadError('Invalid text blob');
  return Buffer.from(blob.content.replace(/\s/g, ''), 'base64').toString('utf8');
}

export function rawFileUrl(commitSha, path) {
  const { owner, repo } = config();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/${encodedPath}`;
}
