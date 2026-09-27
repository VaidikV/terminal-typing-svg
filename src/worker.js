// Cloudflare Worker: serves the typing-terminal SVG API and the demo page.
//   /?lines=$ whoami;Backend engineer   -> image/svg+xml
//   /demo (or / without params)          -> demo page
import { generateSVG, errorSVG } from "./generator.js";
import { generateStatsSVG } from "./stats.js";
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
  const { fontFamily, fontCSS } = await resolveFont(url.searchParams.get("font"));
  const { svg } = generateStatsSVG(data, url.searchParams, { fontFamily, fontCSS });
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml;charset=UTF-8",
      "cache-control": `public, max-age=${STATS_TTL}`,
    },
  });
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
  const [user, repos, prs, issues] = await Promise.all([
    gh("user", `/users/${username}`),
    gh("repos", `/users/${username}/repos?per_page=100&type=owner&sort=pushed`),
    gh("prs", `/search/issues?q=author:${username}+type:pr&per_page=1`),
    gh("issues", `/search/issues?q=author:${username}+type:issue&per_page=1`),
  ]);
  if (!user || !Array.isArray(repos)) return null;

  const own = repos.filter((r) => !r.fork);
  const stars = own.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const langCount = {};
  for (const r of own) {
    if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  }
  const langs = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const data = {
    username: user.login,
    stars,
    repos: user.public_repos,
    prs: prs ? prs.total_count : 0,
    issues: issues ? issues.total_count : 0,
    followers: user.followers,
    langs,
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
