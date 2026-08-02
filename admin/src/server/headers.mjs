export const ADMIN_CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://raw.githubusercontent.com https://*.tile.openstreetmap.org",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

export const ADMIN_SECURITY_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Security-Policy': ADMIN_CSP,
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow',
});

// Netlify's static custom-header rules do not apply to responses produced by
// Functions or framework SSR. Apply the complete policy at the response source
// as well as keeping admin/netlify.toml as defense in depth for static assets.
export function applyAdminSecurityHeaders(response) {
  for (const [name, value] of Object.entries(ADMIN_SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}
