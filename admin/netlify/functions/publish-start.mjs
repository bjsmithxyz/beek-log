import { json } from '../../src/server/auth.mjs';
import { createPublication, publicationErrorResponse, TRAVEL_POLICY } from '../../src/server/publisher.mjs';
import { takeRateLimit } from '../../src/server/rate-limit.mjs';
import { mutationResponse, requireJsonMutation } from '../../src/server/request-guards.mjs';
import { travelPublication } from '../../src/server/travel-publish.mjs';

const PUBLISH_LIMIT = { limit: 10, windowMs: 60_000 };

export default async function publishStart(request) {
  const context = await requireJsonMutation(request);
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
    const publication = travelPublication(context.body);
    const result = await createPublication(publication, {
      token: context.session.token,
      policy: TRAVEL_POLICY,
    });
    return mutationResponse(json(201, { ok: true, publication: result }), context);
  } catch (error) {
    const failure = publicationErrorResponse(error);
    return mutationResponse(json(failure.status, failure.body), context);
  }
}
