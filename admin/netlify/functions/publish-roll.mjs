import { json } from '../../src/server/auth.mjs';
import { createPublication, publicationErrorResponse } from '../../src/server/publisher.mjs';
import { takeRateLimit } from '../../src/server/rate-limit.mjs';
import { mutationResponse, requireJsonMutation } from '../../src/server/request-guards.mjs';
import { rollPublication } from '../../src/server/roll-publish.mjs';

const PUBLISH_LIMIT = { limit: 10, windowMs: 60_000 };

async function publishRoll(request) {
  const context = await requireJsonMutation(request, { maxBytes: 512 * 1024 });
  if (context.response) return context.response;
  const limited = takeRateLimit(`publish:${context.session.login}`, PUBLISH_LIMIT);
  if (!limited.ok) {
    return mutationResponse(json(429, {
      ok: false,
      error: 'Too many publish attempts; try again shortly.',
      code: 'rate_limited',
    }, { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) }), context);
  }
  try {
    const publication = rollPublication(context.body);
    const result = await createPublication(publication.input, {
      token: context.session.token,
      policy: publication.policy,
    });
    return mutationResponse(json(201, {
      ok: true,
      publication: result,
      summary: publication.summary,
    }), context);
  } catch (error) {
    const failure = publicationErrorResponse(error);
    return mutationResponse(json(failure.status, failure.body), context);
  }
}

export { publishRoll };

function netlifyHeaders(response) {
  const headers = {};
  const setCookie = [];
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      setCookie.push(value);
      continue;
    }
    headers[key] = value;
  }
  // Object.fromEntries collapses duplicate Set-Cookie values; keep them in
  // multiValueHeaders so a refreshed session cookie is not dropped.
  if (setCookie.length === 1) headers['set-cookie'] = setCookie[0];
  return {
    headers,
    ...(setCookie.length > 1 ? { multiValueHeaders: { 'set-cookie': setCookie } } : {}),
  };
}

// Netlify classifies this bundle as a v1 Function in production. Export only
// the explicit legacy handler entrypoint so the build and runtime agree.
export async function handler(event) {
  const url = event.rawUrl || new URL(event.path || '/.netlify/functions/publish-roll', 'https://admin.bjsmith.xyz').href;
  const method = event.httpMethod || 'GET';
  const request = new Request(url, {
    method,
    headers: event.headers || {},
    ...(['GET', 'HEAD'].includes(method) ? {} : {
      body: event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : (event.body || ''),
    }),
  });
  const response = await publishRoll(request);
  return {
    statusCode: response.status,
    ...netlifyHeaders(response),
    body: await response.text(),
  };
}
