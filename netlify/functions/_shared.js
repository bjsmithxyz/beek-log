const crypto = require("crypto");

const COOKIE = "tlwr_session";
const STATE_COOKIE = "tlwr_oauth_state";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function env(name, fallback) {
  const v = process.env[name];
  if (v == null || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env var ${name}`);
  }
  return v;
}

function siteUrl() {
  return (process.env.SITE_URL || process.env.URL || "http://localhost:8888").replace(/\/$/, "");
}

function repoParts() {
  const full = env("GITHUB_REPO", "bjsmithxyz/the-long-way-round");
  const [owner, repo] = full.split("/");
  return {
    owner,
    repo,
    branch: env("GITHUB_BRANCH", "main"),
    path: env("GITHUB_PATH", "trips.json"),
  };
}

function allowedUsers() {
  return env("OAUTH_ALLOWED_USERS", "bjsmithxyz")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function keyFromSecret(secret) {
  return crypto.createHash("sha256").update(secret).digest();
}

function seal(payload, secret) {
  const iv = crypto.randomBytes(12);
  const key = keyFromSecret(secret);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function unseal(token, secret) {
  const buf = Buffer.from(token, "base64url");
  if (buf.length < 28) throw new Error("bad session");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const key = keyFromSecret(secret);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const json = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  return JSON.parse(json);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function cookieAttrs(maxAge) {
  const secure = siteUrl().startsWith("https");
  const parts = [`Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=${maxAge}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function setCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; ${cookieAttrs(maxAge)}`;
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function readSession(event) {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || "");
  const raw = cookies[COOKIE];
  if (!raw) return null;
  try {
    const data = unseal(raw, env("SESSION_SECRET"));
    if (!data || !data.token || !data.login) return null;
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function sessionCookie(login, token) {
  const payload = {
    login,
    token,
    exp: Date.now() + MAX_AGE * 1000,
  };
  return setCookie(COOKIE, seal(payload, env("SESSION_SECRET")), MAX_AGE);
}

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function redirect(location, cookies = []) {
  const headers = {
    Location: [location],
    "Cache-Control": ["no-store"],
  };
  if (cookies.length) headers["Set-Cookie"] = cookies;
  return { statusCode: 302, multiValueHeaders: headers, body: "" };
}

module.exports = {
  COOKIE,
  STATE_COOKIE,
  MAX_AGE,
  env,
  siteUrl,
  repoParts,
  allowedUsers,
  seal,
  unseal,
  parseCookies,
  setCookie,
  clearCookie,
  readSession,
  sessionCookie,
  json,
  redirect,
};
