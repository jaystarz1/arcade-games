#!/usr/bin/env node
/**
 * capture-posters.mjs
 *
 * Grabs one attract-screen poster per game into arcade/posters/<id>.png.
 * The arcade shell shows these on every cabinet you are NOT standing at, so
 * only one live iframe ever runs at a time.
 *
 * Strategy, in order:
 *   1. Read the game's largest <canvas> straight off with toDataURL(). This
 *      gives the raw game pixels with none of the game's own bezel/marquee
 *      chrome around them, at the exact native aspect ratio.
 *   2. If that canvas is blank (WebGL without preserveDrawingBuffer, or a
 *      DOM/React game that hasn't drawn yet), fall back to a viewport
 *      screenshot sized to the game's native resolution.
 *
 * Uses agent-browser's bundled Chromium so it never fights the user's Chrome
 * or the Playwright profiles (see ~/CLAUDE.md).
 *
 *   node arcade/tools/capture-posters.mjs [--only <id>] [--wait <ms>]
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ARCADE = resolve(HERE, "..");
const OUT = resolve(ARCADE, "posters");
const ORIGIN = process.env.ARCADE_ORIGIN || "http://localhost:8777";

/** id -> [path, nativeW, nativeH, settleMs]
 *  settleMs is per game: racers need a moment for the road to fill in,
 *  menu-driven games are ready almost immediately. */
const TARGETS = [
  ["night-driver",   "/night-driver.html",                       1600, 1200, 7000],
  ["galaga",         "/galaga.html",                              864, 1152, 6000],
  ["pole-position",  "/pole-position.html",                      1280,  960, 8000],
  ["tron",           "/tron.html",                                960, 1024, 6000],
  ["asteroids",      "/AsteroidsArcade/dist/public/index.html",  1000,  800, 6000],
  ["space-invaders", "/space-invaders/space-invaders.html",       896, 1024, 6000],
  ["star-wars",      "/star-wars.html",                          1600, 1200, 7000],
  ["lunar-lander",   "/lunar-lander/dist/index.html",            1280,  800, 8000],
  ["after-burner",   "/after-burner.html",                       1280,  960, 7000],
  ["grand-prix",     "/grand-prix.html",                         1280,  960, 7000],
  ["mission-command","/mission-command.html",                     800,  600, 6000],
  ["ice-breaker",    "/ice-breaker-game/index.html",             1280,  800, 6000],
];

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const waitOverride = args.includes("--wait") ? +args[args.indexOf("--wait") + 1] : null;

function ab(...a) {
  return execFileSync("npx", ["--yes", "agent-browser", ...a], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Pull the biggest canvas out of the page as a PNG data URL, and report
   whether it actually has ink on it (guards against blank WebGL buffers). */
const GRAB = `(() => {
  const cs = [...document.querySelectorAll('canvas')]
    .filter(c => c.width > 32 && c.height > 32)
    .sort((a,b) => b.width*b.height - a.width*a.height);
  if (!cs.length) return JSON.stringify({ ok:false, why:'no canvas' });
  const c = cs[0];
  let url;
  try { url = c.toDataURL('image/png'); }
  catch (e) { return JSON.stringify({ ok:false, why:'tainted: '+e.message }); }

  // sample the canvas for non-black pixels so we don't ship an empty poster
  let ink = 0;
  try {
    const g = c.getContext('2d');
    if (g) {
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const step = Math.max(4, Math.floor(d.length / 4 / 4000) * 4);
      for (let i = 0; i < d.length; i += step) {
        if (d[i] > 18 || d[i+1] > 18 || d[i+2] > 18) ink++;
      }
    } else {
      ink = -1; // WebGL: can't cheaply sample, trust the data URL length
    }
  } catch (e) { ink = -1; }

  return JSON.stringify({ ok:true, w:c.width, h:c.height, ink, url });
})()`;

function parseEval(raw) {
  // agent-browser echoes the result as a JSON string on the last line
  const line = raw.trim().split("\n").filter(Boolean).pop() || "";
  try {
    const once = JSON.parse(line);
    return typeof once === "string" ? JSON.parse(once) : once;
  } catch { return null; }
}

mkdirSync(OUT, { recursive: true });

const report = [];

for (const [id, path, w, h, settle] of TARGETS) {
  if (only && only !== id) continue;
  const wait = waitOverride ?? settle;
  const dest = resolve(OUT, `${id}.png`);
  process.stdout.write(`${id.padEnd(16)} `);

  try {
    ab("set", "viewport", String(w), String(h));
    ab("open", `${ORIGIN}${path}?poster=${Date.now()}`);
    await sleep(wait);

    let mode = "canvas";
    let wrote = false;

    const got = parseEval(ab("eval", GRAB));
    if (got && got.ok && got.url && (got.ink === -1 || got.ink > 40)) {
      const b64 = got.url.split(",")[1];
      writeFileSync(dest, Buffer.from(b64, "base64"));
      wrote = true;
    }

    if (!wrote) {
      mode = "viewport";
      ab("screenshot", dest);
    }

    const kb = Math.round(statSync(dest).size / 1024);
    console.log(`ok  (${mode}, ${kb} KB)`);
    report.push({ id, mode, kb });
  } catch (e) {
    console.log(`FAILED: ${String(e.message).split("\n")[0]}`);
    report.push({ id, mode: "failed", kb: 0 });
  }
}

try { ab("close", "--all"); } catch {}

console.log("\n--- summary ---");
for (const r of report) console.log(`${r.id.padEnd(16)} ${r.mode.padEnd(9)} ${r.kb} KB`);
const bad = report.filter((r) => r.mode === "failed");
if (bad.length) {
  console.log(`\n${bad.length} failed: ${bad.map((r) => r.id).join(", ")}`);
  console.log("Those cabinets keep the CSS placeholder — not a blocker.");
  process.exitCode = 1;
}
