// Cloudflare Worker: serves the typing-terminal SVG API and the demo page.
//   /?lines=$ whoami;Backend engineer   -> image/svg+xml
//   /demo (or / without params)          -> demo page
import { generateSVG, errorSVG } from "./generator.js";
import { generateStatsSVG } from "./stats.js";
import { generateHeatmapSVG } from "./heatmap.js";
import { generateDashboardSVG } from "./dashboard.js";
import { generateBlueprintSVG } from "./blueprint.js";
import { DEMO_HTML } from "./demo.js";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Fetch a Google Font and return @font-face CSS with embedded woff2.
// Cached 24h in the worker cache. Returns null on any failure (caller falls
// back to the embedded JetBrains Mono).
async function customFontCSS(fontName) {
  const clean = fontName.replace(/[^0-9A-Za-z\- ]/g, "").trim().slice(0, 40);
  if (!clean || clean.toLowerCase() === "jetbrains mono") return null;
  const cache = caches.default;
  const key = new Request(`https://terminal-typing-svg.fontcache/${encodeURIComponent(clean)}`);
  let res = await cache.match(key);
  if (!res) {
    const cssUrl =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(clean)}:wght@400;600&display=swap`;
    const css = await (await fetch(cssUrl, { headers: { "User-Agent": UA } })).text();
    const faces = [];
    for (const weight of ["400", "600"]) {
      // find a woff2 url near a font-weight: <weight> declaration
      const blockRe = new RegExp(
        `@font-face\\s*{[^}]*font-weight:\\s*${weight}[^}]*}`,
        "g"
      );
      const block = [...css.matchAll(blockRe)].pop();
      const src = block?.[0].match(/url\((https:[^)]+)\)/)?.[1];
      if (!src) continue;
      const buf = await (await fetch(src)).arrayBuffer();
      const b64 = btoa(
        Array.from(new Uint8Array(buf), (b) => String.fromCharCode(b)).join("")
      );
      faces.push(
        `@font-face { font-family: '${clean}'; font-style: normal; font-weight: ${weight}; ` +
          `font-display: swap; src: url(data:font/woff2;base64,${b64}) format('woff2'); }`
      );
    }
    if (faces.length === 0) return null;
    res = new Response(`  <style>\n${faces.join("\n")}\n  </style>`, {
      headers: {
        "content-type": "text/css",
        "cache-control": "public, max-age=86400",
      },
    });
    await cache.put(key, res.clone());
  }
  return { css: await res.text(), family: clean };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/stats") {
      return statsResponse(url, env);
    }

    if (url.pathname === "/demo" || !url.searchParams.has("lines")) {
      return new Response(DEMO_HTML, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    const { fontFamily, fontCSS } = await resolveFont(url.searchParams.get("font"));
    const { svg, error } = generateSVG(url.searchParams, { fontFamily, fontCSS });
    if (error) {
      return new Response(errorSVG(error), {
        status: 422,
        headers: { "content-type": "image/svg+xml;charset=UTF-8" },
      });
    }
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml;charset=UTF-8",
        "cache-control": "public, max-age=86400",
      },
    });
  },
};

async function resolveFont(fontParam) {
  let fontFamily;
  let fontCSS;
  if (fontParam) {
    try {
      const custom = await customFontCSS(fontParam);
      if (custom) {
        fontFamily = custom.family;
        fontCSS = custom.css;
      }
    } catch {
      // fall through to embedded font
    }
  }
  return { fontFamily, fontCSS };
}

const USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const STATS_TTL = 21600; // 6 hours

async function statsResponse(url, env) {
  const username = (url.searchParams.get("username") || "").trim();
  if (!USERNAME_RE.test(username)) {
    return new Response(errorSVG("username parameter must be set."), {
      status: 422,
      headers: { "content-type": "image/svg+xml;charset=UTF-8" },
    });
  }
  const style = (url.searchParams.get("style") || "terminal").toLowerCase();
  if (style === "heatmap") {
    let days = null;
    try {
      days = await getContributions(username);
    } catch {
      days = null;
    }
    if (!days || days.length < 60) {
      return new Response(errorSVG("could not fetch GitHub contributions, try again soon."), {
        status: 502,
        headers: { "content-type": "image/svg+xml;charset=UTF-8" },
      });
    }
    // Profile stats for the heatmap's left column (cached 6h, same as
    // the other styles, so this adds no extra GitHub API load).
    let stats = null;
    try {
      stats = await getStats(username, env);
    } catch {
      stats = null;
    }
    const { svg } = generateHeatmapSVG(username, days, url.searchParams, {
      stars: stats ? stats.stars : null,
      commits: stats ? stats.commits : null,
      prs: stats ? stats.prs : null,
      issues: stats ? stats.issues : null,
    });
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml;charset=UTF-8",
        "cache-control": `public, max-age=${STATS_TTL}`,
      },
    });
  }
  let data = null;
  try {
    data = await getStats(username, env);
  } catch {
    data = null;
  }
  if (!data) {
    return new Response(errorSVG("could not fetch GitHub stats, try again soon."), {
      status: 502,
      headers: { "content-type": "image/svg+xml;charset=UTF-8" },
    });
  }
  const respond = (svg) =>
    new Response(svg, {
      headers: {
        "content-type": "image/svg+xml;charset=UTF-8",
        "cache-control": `public, max-age=${STATS_TTL}`,
      },
    });
  if (style === "dashboard") {
    const { svg } = generateDashboardSVG(data, url.searchParams);
    return respond(svg);
  }
  if (style === "blueprint") {
    const { svg } = generateBlueprintSVG(data, url.searchParams);
    return respond(svg);
  }
  const { fontFamily, fontCSS } = await resolveFont(url.searchParams.get("font"));
  const { svg } = generateStatsSVG(data, url.searchParams, { fontFamily, fontCSS });
  return respond(svg);
}

// Fetch the public contributions calendar page for a username and parse it
// into per-day {date, count, level} entries. No GitHub token needed; the page
// is public. Parsed JSON is cached 6h in the worker cache.
async function getContributions(username) {
  const cache = caches.default;
  const key = new Request(
    `https://terminal-typing-svg.contribs/${username.toLowerCase()}`
  );
  const hit = await cache.match(key);
  if (hit) return hit.json();

  const res = await fetch(`https://github.com/users/${username}/contributions`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
  });
  if (!res.ok) return null;
  const days = parseContributions(await res.text());
  if (!days || days.length < 60) return null;

  const body = new Response(JSON.stringify(days), {
    headers: {
      "content-type": "application/json",
      "cache-control": `public, max-age=${STATS_TTL}`,
    },
  });
  await cache.put(key, body.clone());
  return days;
}

const MONTH_IDX = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function parseContributions(html) {
  const tips = new Map();
  const tipRe =
    /<tool-tip[^>]*for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]*)<\/tool-tip>/g;
  let m;
  while ((m = tipRe.exec(html))) tips.set(m[1], m[2].trim());

  const days = [];
  const cellRe = /id="(contribution-day-component-\d+-\d+)" data-level="(\d)"/g;
  const now = new Date();
  const cy = now.getUTCFullYear();
  const cm = now.getUTCMonth();
  const cd = now.getUTCDate();
  while ((m = cellRe.exec(html))) {
    const tip = tips.get(m[1]);
    if (!tip) continue;
    let count = 0;
    let month = -1;
    let day = 0;
    let tm = /(\d+) contributions? on ([A-Za-z]+) (\d+)/.exec(tip);
    if (tm) {
      count = parseInt(tm[1], 10);
      month = MONTH_IDX[tm[2].toLowerCase()];
      day = parseInt(tm[3], 10);
    } else {
      tm = /No contributions on ([A-Za-z]+) (\d+)/.exec(tip);
      if (tm) {
        month = MONTH_IDX[tm[1].toLowerCase()];
        day = parseInt(tm[2], 10);
      }
    }
    if (month === undefined || month < 0 || !day) continue;
    // The calendar covers the trailing ~12 months, so a month/day later in
    // the year than today must belong to last year.
    const year = month > cm || (month === cm && day > cd) ? cy - 1 : cy;
    const ds =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({ date: ds, count, level: Math.min(4, parseInt(m[2], 10)) });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return days;
}

// Fetch public GitHub stats for a username. Raw JSON is cached 6h in the
// worker cache so repeat card renders never touch the GitHub API.
async function getStats(username, env) {
  const cache = caches.default;
  const key = new Request(
    `https://terminal-typing-svg.statscache/${username.toLowerCase()}`
  );
  const hit = await cache.match(key);
  if (hit) return hit.json();

  const headers = { "User-Agent": UA, Accept: "application/vnd.github+json" };
  if (env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${env.GITHUB_TOKEN}`;
  const gh = (name, path) =>
    fetch(`https://api.github.com${path}`, { headers }).then((r) =>
      r.ok ? r.json() : null
    );
  const [user, repos, prs, issues, commits] = await Promise.all([
    gh("user", `/users/${username}`),
    gh("repos", `/users/${username}/repos?per_page=100&type=owner&sort=pushed`),
    gh("prs", `/search/issues?q=author:${username}+type:pr&per_page=1`),
    gh("issues", `/search/issues?q=author:${username}+type:issue&per_page=1`),
    gh("commits", `/search/commits?q=author:${username}&per_page=1`),
  ]);
  if (!user || !Array.isArray(repos)) return null;

  const own = repos.filter((r) => !r.fork);
  const stars = own.reduce((s, r) => s + (r.stargazers_count || 0), 0);

  const data = {
    username: user.login,
    stars,
    repos: user.public_repos,
    prs: prs ? prs.total_count : 0,
    issues: issues ? issues.total_count : 0,
    commits: commits ? commits.total_count : null,
    followers: user.followers,
  };
  const res = new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
      "cache-control": `public, max-age=${STATS_TTL}`,
    },
  });
  await cache.put(key, res.clone());
  return data;
}
