// Local-only guards plus compatibility re-exports for the dev roll admin.
// Authoring rules live in @beek/shared so the hosted admin can use the same code.
export { parseFolderName } from '@beek/shared/folder-name';
export { slugify, deriveSlug } from '@beek/shared/slug';
export {
  buildRollMarkdown,
  parseRollMarkdown,
  rollInputErrors,
} from '@beek/shared/roll-markdown';

// Cross-origin guard for the localhost admin server. Browsers always send
// Host, and send Origin on cross-site requests: a DNS-rebinding attack arrives
// with a foreign Host, a CSRF POST from a malicious page with a foreign Origin
// (its side effects would land even though the response is unreadable). Both
// are refused. Same-origin fetches and non-browser clients (no Origin,
// loopback Host) pass. Returns an error string, or null when allowed.
export function crossOriginError({ host, origin }, allowedHosts) {
  if (!host || !allowedHosts.includes(host)) return `forbidden Host: ${host}`;
  if (origin == null) return null;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = null;
  }
  if (originHost === null || !allowedHosts.includes(originHost)) return `forbidden Origin: ${origin}`;
  return null;
}

// Guards the dev-only /api/preview endpoint: only render existing image files.
// `exists` is injected so this stays pure (lib.mjs does no I/O).
export function validatePreviewPath(path, { imageRe, exists }) {
  if (!path || typeof path !== 'string') return 'path required';
  if (!imageRe.test(path)) return 'not an image file';
  if (!exists(path)) return 'file not found';
  return null;
}
