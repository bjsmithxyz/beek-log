import { json } from '../../src/server/auth.mjs';
import { createPublication, publicationErrorResponse } from '../../src/server/publisher.mjs';
import { mutationResponse, requireJsonMutation } from '../../src/server/request-guards.mjs';
import { rollPublication } from '../../src/server/roll-publish.mjs';

async function publishRoll(request) {
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

export { publishRoll };

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
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
}
