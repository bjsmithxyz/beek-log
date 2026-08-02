import { json, withSessionCookie } from '../../src/server/auth.mjs';
import { publicationErrorResponse, publicationStatus } from '../../src/server/publisher.mjs';
import { requireGetSession } from '../../src/server/request-guards.mjs';

export default async function publishStatus(request) {
  const context = await requireGetSession(request);
  if (context.response) return context.response;
  try {
    const number = new URL(request.url).searchParams.get('number');
    const publication = await publicationStatus(number, { token: context.session.token });
    return withSessionCookie(json(200, { ok: true, publication }), context.setCookie);
  } catch (error) {
    const failure = publicationErrorResponse(error);
    return withSessionCookie(json(failure.status, failure.body), context.setCookie);
  }
}
