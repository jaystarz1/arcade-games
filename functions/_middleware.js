/**
 * Interim gate for the arcade.
 *
 * The intended long-term gate is Cloudflare Access (email allowlist +
 * one-time PIN), configured in the Zero Trust dashboard. This middleware
 * exists so the site is NEVER publicly reachable in the window between the
 * first deploy and Access being switched on. Once Access is in front of the
 * hostname you can delete this file, or keep it as a second lock.
 *
 * It FAILS CLOSED: if ARCADE_PASSWORD is not set, everything is refused.
 * A missing secret must never mean an open arcade.
 */

const REALM = 'Basic realm="The Arcade", charset="UTF-8"';

/** Constant-time string compare, so the response time leaks nothing. */
function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  // compare a fixed number of bytes regardless of length
  const len = Math.max(x.length, y.length);
  let diff = x.length ^ y.length;
  for (let i = 0; i < len; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

function deny(status, body) {
  const headers = {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow, noarchive",
  };
  if (status === 401) headers["WWW-Authenticate"] = REALM;
  return new Response(body, { status, headers });
}

export async function onRequest(context) {
  const { request, env, next } = context;

  const expected = env.ARCADE_PASSWORD;
  if (!expected) {
    // No credential configured: refuse everything rather than expose the site.
    return deny(503, "The arcade is closed. (No credential configured.)");
  }

  const auth = request.headers.get("Authorization") || "";
  if (auth.startsWith("Basic ")) {
    let decoded = "";
    try { decoded = atob(auth.slice(6)); } catch { decoded = ""; }
    const sep = decoded.indexOf(":");
    const supplied = sep === -1 ? "" : decoded.slice(sep + 1);
    if (supplied && safeEqual(supplied, expected)) {
      const res = await next();
      const out = new Response(res.body, res);
      out.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
      return out;
    }
  }

  return deny(401, "Insert coin. (Authentication required.)");
}
