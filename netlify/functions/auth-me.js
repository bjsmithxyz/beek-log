const { readSession, json } = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Cache-Control": "no-store" }, body: "" };
  }
  const session = readSession(event);
  if (!session) return json(401, { ok: false, login: null });
  return json(200, { ok: true, login: session.login });
};
