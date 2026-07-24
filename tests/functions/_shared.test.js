const test = require("node:test");
const assert = require("node:assert/strict");
const { isSameOrigin, parseCookies, seal, unseal } = require("../../netlify/functions/_shared");

test("same-origin checks use the configured site origin", () => {
  const previous = process.env.SITE_URL;
  process.env.SITE_URL = "https://travel.bjsmith.xyz";
  try {
    assert.equal(isSameOrigin({ headers: { origin: "https://travel.bjsmith.xyz" } }), true);
    assert.equal(isSameOrigin({ headers: { origin: "https://evil.example" } }), false);
    assert.equal(isSameOrigin({ headers: {} }), false);
  } finally {
    if (previous === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previous;
  }
});

test("malformed cookie encoding is ignored", () => {
  assert.deepEqual(parseCookies("good=value; broken=%ZZ"), { good: "value" });
});

test("session encryption rejects weak secrets and round-trips valid payloads", () => {
  assert.throws(() => seal({ login: "beek" }, "too-short"), /at least 32 bytes/);
  const secret = "a-secure-test-secret-with-at-least-32-bytes";
  const token = seal({ login: "beek" }, secret);
  assert.deepEqual(unseal(token, secret), { login: "beek" });
});
