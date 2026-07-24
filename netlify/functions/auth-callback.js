const {
  env,
  siteUrl,
  allowedUsers,
  parseCookies,
  setCookie,
  clearCookie,
  STATE_COOKIE,
  sessionCookie,
  redirect,
} = require("./_shared");

exports.handler = async (event) => {
  const home = `${siteUrl()}/`;
  try {
    const params = event.queryStringParameters || {};
    const code = params.code;
    const state = params.state;
    if (!code || !state) {
      return redirect(`${home}?auth=error&reason=missing_code`);
    }

    const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || "");
    if (!cookies[STATE_COOKIE] || cookies[STATE_COOKIE] !== state) {
      return redirect(`${home}?auth=error&reason=bad_state`, [clearCookie(STATE_COOKIE)]);
    }

    const redirectUri = `${siteUrl()}/.netlify/functions/auth-callback`;
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env("GITHUB_CLIENT_ID"),
        client_secret: env("GITHUB_CLIENT_SECRET"),
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
      return redirect(`${home}?auth=error&reason=token_exchange`, [clearCookie(STATE_COOKIE)]);
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenJson.access_token}`,
        "User-Agent": "long-way-round",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!userRes.ok) {
      return redirect(`${home}?auth=error&reason=user`, [clearCookie(STATE_COOKIE)]);
    }
    const user = await userRes.json();
    const login = (user.login || "").toLowerCase();
    if (!allowedUsers().includes(login)) {
      return redirect(`${home}?auth=error&reason=not_allowed`, [clearCookie(STATE_COOKIE)]);
    }

    return redirect(`${home}?auth=ok`, [
      sessionCookie(user.login, tokenJson.access_token),
      clearCookie(STATE_COOKIE),
    ]);
  } catch (e) {
    return redirect(`${home}?auth=error&reason=server`);
  }
};
