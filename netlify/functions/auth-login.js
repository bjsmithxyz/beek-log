const crypto = require("crypto");
const { env, siteUrl, setCookie, STATE_COOKIE, redirect } = require("./_shared");

exports.handler = async () => {
  try {
    const clientId = env("GITHUB_CLIENT_ID");
    const state = crypto.randomBytes(16).toString("hex");
    const redirectUri = `${siteUrl()}/.netlify/functions/auth-callback`;
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "public_repo");
    url.searchParams.set("state", state);

    return redirect(url.toString(), [setCookie(STATE_COOKIE, state, 600)]);
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: `Auth login misconfigured: ${e.message}`,
    };
  }
};
