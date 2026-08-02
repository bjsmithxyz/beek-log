const { readSession, repoParts, json, allowedUsers, isSameOrigin } = require("./_shared");
const { validateTrip } = require("../../trip-validation");

const MAX_BODY_BYTES = 256 * 1024;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" }, { Allow: "POST" });
  }
  if (!isSameOrigin(event)) {
    return json(403, { ok: false, error: "Cross-origin requests are not allowed" });
  }
  const contentType = event.headers["content-type"] || event.headers["Content-Type"] || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json(415, { ok: false, error: "Content-Type must be application/json" });
  }

  const session = readSession(event);
  if (!session) return json(401, { ok: false, error: "Not signed in" });
  if (!allowedUsers().includes(String(session.login || "").toLowerCase())) {
    return json(403, { ok: false, error: "Not allowed to save" });
  }

  const rawBody = event.body || "";
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: "Trip data is too large" });
  }

  let body;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body" });
  }
  const errors = validateTrip(body);
  if (errors.length) {
    return json(400, { ok: false, error: errors[0], errors });
  }

  const { owner, repo, branch, path } = repoParts();
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${session.token}`,
    "User-Agent": "long-way-round",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    let sha;
    const get = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers });
    if (get.status === 200) {
      sha = (await get.json()).sha;
    } else if (get.status !== 404) {
      const err = await get.text();
      return json(get.status, { ok: false, error: `Could not read file: ${err}` });
    }

    const content = Buffer.from(JSON.stringify(body, null, 2), "utf8").toString("base64");
    const put = await fetch(api, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Update trip via editor (${new Date().toISOString().slice(0, 16).replace("T", " ")})`,
        content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (put.status === 200 || put.status === 201) {
      return json(200, { ok: true, path, branch, committer: session.login });
    }
    const err = await put.json().catch(() => ({}));
    return json(put.status, {
      ok: false,
      error: err.message || `GitHub save failed (${put.status})`,
    });
  } catch (e) {
    return json(500, { ok: false, error: e.message || "Save failed" });
  }
};
