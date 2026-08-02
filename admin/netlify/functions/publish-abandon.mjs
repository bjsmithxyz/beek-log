import { json } from '../../src/server/auth.mjs';
import { abandonPublication, publicationErrorResponse, validateControlInput } from '../../src/server/publisher.mjs';
import { mutationResponse, requireJsonMutation } from '../../src/server/request-guards.mjs';

export default async function publishAbandon(request) {
  const context = await requireJsonMutation(request, { maxBytes: 16 * 1024 });
  if (context.response) return context.response;
  try {
    const input = validateControlInput(context.body);
    const result = await abandonPublication(input.number, input.headSha, { token: context.session.token });
    return mutationResponse(json(200, { ok: true, publication: result }), context);
  } catch (error) {
    const failure = publicationErrorResponse(error);
    return mutationResponse(json(failure.status, failure.body), context);
  }
}
