// Cloudflare Worker: serves the typing-terminal SVG API and the demo page.
//   /?lines=$ whoami;Backend engineer   -> image/svg+xml
//   /demo (or / without params)          -> demo page
import { generateSVG, errorSVG } from "./generator.js";
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
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/demo" || !url.searchParams.has("lines")) {
      return new Response(DEMO_HTML, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    let fontFamily;
    let fontCSS;
    const fontParam = url.searchParams.get("font");
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
