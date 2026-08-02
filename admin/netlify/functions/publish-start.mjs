import { json } from '../../src/server/auth.mjs';
import { createPublication, publicationErrorResponse, TRAVEL_POLICY } from '../../src/server/publisher.mjs';
import { mutationResponse, requireJsonMutation } from '../../src/server/request-guards.mjs';
import { travelPublication } from '../../src/server/travel-publish.mjs';

export default async function publishStart(request) {
  const context = await requireJsonMutation(request);
  if (context.response) return context.response;
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
