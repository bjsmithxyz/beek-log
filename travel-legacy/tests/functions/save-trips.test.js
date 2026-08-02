const test = require("node:test");
const assert = require("node:assert/strict");
const { handler } = require("../../netlify/functions/save-trips");

test("save endpoint only accepts POST", async () => {
  const response = await handler({ httpMethod: "GET", headers: {} });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
});

test("save endpoint rejects cross-origin requests", async () => {
  const response = await handler({
    httpMethod: "POST",
    headers: { origin: "https://evil.example", "content-type": "application/json" },
  });
  assert.equal(response.statusCode, 403);
});

test("save endpoint requires JSON before reading a session", async () => {
  const response = await handler({
    httpMethod: "POST",
    headers: { origin: "http://localhost:8888", "content-type": "text/plain" },
  });
  assert.equal(response.statusCode, 415);
});
