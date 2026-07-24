const {
  COOKIE,
  STATE_COOKIE,
  clearCookie,
  isSameOrigin,
  json,
} = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" }, { Allow: "POST" });
  }
  if (!isSameOrigin(event)) {
    return json(403, { ok: false, error: "Cross-origin requests are not allowed" });
  }
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    multiValueHeaders: {
      "Set-Cookie": [clearCookie(COOKIE), clearCookie(STATE_COOKIE)],
    },
    body: JSON.stringify({ ok: true }),
  };
};
