const { COOKIE, STATE_COOKIE, clearCookie, siteUrl, redirect } = require("./_shared");

exports.handler = async () => {
  return redirect(`${siteUrl()}/`, [clearCookie(COOKIE), clearCookie(STATE_COOKIE)]);
};
