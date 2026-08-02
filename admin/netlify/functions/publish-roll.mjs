import { json } from '../../src/server/auth.mjs';
import { createPublication, publicationErrorResponse } from '../../src/server/publisher.mjs';
import { mutationResponse, requireJsonMutation } from '../../src/server/request-guards.mjs';
import { rollPublication } from '../../src/server/roll-publish.mjs';

export default async function publishRoll(request) {
  const context = await requireJsonMutation(request, { maxBytes: 512 * 1024 });
  if (context.response) return context.response;
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
