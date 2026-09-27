// Core SVG generator: terminal-style typing animation.
// Pure function of params -> SVG string. No I/O, no network. Shared by the
// worker and (optionally) any other runtime.
import { THEMES, THEME_NAMES } from "./themes.js";
import { FONT_B64 } from "./font.js";

const FONT_STACK_BASE =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

const DEFAULTS = {
  fontSize: 15,
  typingSpeed: 60, // ms per char
  deleteSpeed: 18, // ms per char
  hold: 2000, // ms to show the finished scene
  repeat: true,
  theme: "github-dark",
  prompt: "user@github",
  title: "zsh",
  minWidth: 560,
};

const OUT_LEAD = 250;
const OUT_STAGGER = 350;
const OUT_DUR = 350;
const OUT_FADE = 250;
const GAP = 150;
const CHROME_H = 46;
const CONTENT_TOP = 76;
const LINE_H = 27;
const PAD_X = 28;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function checkColor(v, fallback) {
  const s = String(v ?? "").replace(/[^0-9a-fA-F]/g, "");
  return [3, 4, 6, 8].includes(s.length) ? `#${s}` : fallback;
}

function checkPositiveInt(v, fallback) {
  const n = parseInt(String(v ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function checkBool(v, fallback) {
  if (v === undefined || v === null || v === "") return fallback;
  return String(v).toLowerCase() === "true";
}

function fontFaceCSS() {
  const faces = Object.entries(FONT_B64)
    .map(
      ([weight, b64]) =>
        `    @font-face { font-family: 'JetBrains Mono'; font-style: normal; ` +
        `font-weight: ${weight}; font-display: swap; ` +
        `src: url(data:font/woff2;base64,${b64}) format('woff2'); }`
    )
    .join("\n");
  return `  <style>\n${faces}\n  </style>`;
}

// Parse `lines` into scenes: a line starting with "$ " is a typed command and
// starts a new scene; other lines are output lines of the current scene.
function parseScenes(linesParam) {
  const raw = String(linesParam ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (raw.length === 0) return { error: "lines parameter must be set." };
  const scenes = [];
  for (const line of raw) {
    if (line.startsWith("$ ")) {
      scenes.push({ cmd: line.slice(2), out: [] });
    } else if (scenes.length === 0) {
      return {
        error: "lines must include at least one command prefixed with '$ '.",
      };
    } else {
      scenes[scenes.length - 1].out.push(line);
    }
  }
  return { scenes };
}

export function buildParams(query) {
  const q = query instanceof URLSearchParams ? query : new URLSearchParams(query);
  const theme = THEMES[q.get("theme")] ? q.get("theme") : DEFAULTS.theme;
  const t = { ...THEMES[theme] };
  // per-request color overrides
  for (const k of [
    "bg1", "bg2", "border", "promptUser", "promptPath",
    "promptDollar", "command", "output", "accent", "titleColor",
  ]) {
    const target = k === "titleColor" ? "title" : k;
    if (q.get(k)) t[target] = checkColor(q.get(k), t[target]);
  }
  const fontSize = checkPositiveInt(q.get("fontSize"), DEFAULTS.fontSize);
  return {
    theme, t,
    fontSize,
    adv: fontSize * 0.6,
    typingSpeed: checkPositiveInt(q.get("typingSpeed"), DEFAULTS.typingSpeed),
    deleteSpeed: checkPositiveInt(q.get("deleteSpeed"), DEFAULTS.deleteSpeed),
    hold: checkPositiveInt(q.get("hold"), DEFAULTS.hold),
    repeat: checkBool(q.get("repeat"), DEFAULTS.repeat),
    prompt: (q.get("prompt") ?? DEFAULTS.prompt).slice(0, 40),
    title: (q.get("title") ?? DEFAULTS.title).slice(0, 40),
    minWidth: checkPositiveInt(q.get("width"), DEFAULTS.minWidth),
  };
}

export function generateSVG(rawQuery, opts = {}) {
  const fontFamily = (opts.fontFamily || "JetBrains Mono").replace(/["<>]/g, "");
  const stack = `'${fontFamily}', ${FONT_STACK_BASE}`;
  const p = buildParams(rawQuery);
  const { error, scenes } = parseScenes(
    rawQuery instanceof URLSearchParams
      ? rawQuery.get("lines")
      : new URLSearchParams(rawQuery).get("lines")
  );
  if (error) return { error };

  const promptText = `${p.prompt}:~$ `;
  const promptSpans = [
    [p.prompt, p.t.promptUser],
    [":", p.t.promptDollar],
    ["~", p.t.promptPath],
    ["$ ", p.t.promptDollar],
  ];

  let maxChars = 0;
  for (const s of scenes) {
    maxChars = Math.max(
      maxChars,
      promptText.length + s.cmd.length + 1,
      ...s.out.map((o) => o.length)
    );
  }
  const width = Math.max(p.minWidth, Math.ceil(maxChars * p.adv + PAD_X * 2));
  const maxLines = Math.max(...scenes.map((s) => 1 + s.out.length));
  const height = CHROME_H + maxLines * LINE_H + 26;
  const n = scenes.length;

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`
  );
  parts.push(opts.fontCSS || fontFaceCSS());
  parts.push(
    `  <defs>\n    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">\n` +
      `      <stop offset="0" stop-color="${p.t.bg1}"/><stop offset="1" stop-color="${p.t.bg2}"/>\n` +
      `    </linearGradient>\n  </defs>\n` +
      `  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="10" fill="url(#bg)" stroke="${p.t.border}"/>\n` +
      `  <circle cx="28" cy="23" r="6" fill="#ff5f57"/>\n` +
      `  <circle cx="48" cy="23" r="6" fill="#febc2e"/>\n` +
      `  <circle cx="68" cy="23" r="6" fill="#28c840"/>\n` +
      `  <text x="92" y="28" font-family="${stack}" font-size="12" fill="${p.t.title}">${esc(p.title)}</text>\n` +
      `  <line x1="12" y1="${CHROME_H}" x2="${width - 12}" y2="${CHROME_H}" stroke="${p.t.divider}"/>`
  );

  scenes.forEach((scene, i) => {
    const nChars = promptText.length + scene.cmd.length + 1; // + block cursor
    const typeDur = nChars * p.typingSpeed;
    const outBlock = OUT_LEAD + (scene.out.length - 1) * OUT_STAGGER + OUT_DUR;
    const last = i === n - 1 && !p.repeat;
    const delDur = last ? 0 : nChars * p.deleteSpeed;
    const preDelete = typeDur + outBlock + p.hold + OUT_FADE;
    const sceneDur = preDelete + delDur + (last ? 0 : 120);

    const y = CONTENT_TOP;
    const fullLen = nChars * p.adv + 14;
    const d0 = `M ${PAD_X},${y} h0`;
    const d1 = `M ${PAD_X},${y} h${fullLen.toFixed(1)}`;
    const kType = typeDur / sceneDur;
    const kHold = preDelete / sceneDur;
    const values = last ? `${d0} ; ${d1} ; ${d1}` : `${d0} ; ${d1} ; ${d1} ; ${d0}`;
    const keyTimes = last
      ? `0;${kType.toFixed(4)};1`
      : `0;${kType.toFixed(4)};${kHold.toFixed(4)};1`;
    const begin = i === 0 ? (p.repeat ? `0s;tpa${n - 1}.end+${GAP}ms` : "0s") : `tpa${i - 1}.end+${GAP}ms`;

    const tspans =
      promptSpans.map(([txt, c]) => `<tspan fill="${c}">${esc(txt)}</tspan>`).join("") +
      `<tspan fill="${p.t.command}" font-weight="600">${esc(scene.cmd)}</tspan>` +
      `<tspan fill="${p.t.accent}">\u2588` +
      `<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" ` +
      `dur="1.06s" repeatCount="indefinite" ` +
      `begin="tpa${i}.begin+${typeDur}ms" end="tpa${i}.begin+${preDelete}ms"/>` +
      `</tspan>`;

    parts.push(
      `  <g id="scene${i}">\n` +
        `    <path id="tp${i}" d="${d0}" fill="none">\n` +
        `      <animate id="tpa${i}" attributeName="d" begin="${begin}" dur="${sceneDur}ms" fill="freeze"\n` +
        `        values="${values}" keyTimes="${keyTimes}"/>\n` +
        `    </path>\n` +
        `    <text font-family="${stack}" font-size="${p.fontSize}">\n` +
        `      <textPath xlink:href="#tp${i}" href="#tp${i}">${tspans}</textPath>\n` +
        `    </text>`
    );

    scene.out.forEach((out, k) => {
      const oy = y + (k + 1) * LINE_H;
      const tIn0 = (typeDur + OUT_LEAD + k * OUT_STAGGER) / sceneDur;
      const tIn1 = (typeDur + OUT_LEAD + k * OUT_STAGGER + OUT_DUR) / sceneDur;
      const tOut0 = (typeDur + outBlock + p.hold) / sceneDur;
      const tOut1 = (typeDur + outBlock + p.hold + OUT_FADE) / sceneDur;
      parts.push(
        `    <text x="${PAD_X}" y="${oy}" font-family="${stack}" font-size="${p.fontSize}" fill="${p.t.output}" opacity="0">${esc(out)}\n` +
          `      <animate attributeName="opacity" begin="tpa${i}.begin" dur="${sceneDur}ms" fill="freeze"\n` +
          `        values="0;0;1;1;${last ? "1;1" : "0;0"}" keyTimes="0;${tIn0.toFixed(4)};${tIn1.toFixed(4)};${tOut0.toFixed(4)};${tOut1.toFixed(4)};1"/>\n` +
          `    </text>`
      );
    });
    parts.push("  </g>");
  });

  parts.push("</svg>");
  return { svg: parts.join("\n") + "\n" };
}

export function errorSVG(message) {
  const stack = `'JetBrains Mono', ${FONT_STACK_BASE}`;
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60" viewBox="0 0 400 60">\n` +
    `  <rect x="1" y="1" width="398" height="58" rx="8" fill="#0d1117" stroke="#f85149"/>\n` +
    `  <text x="20" y="36" font-family="${stack}" font-size="14" fill="#f85149">${esc(message)}</text>\n` +
    `</svg>\n`
  );
}

export { THEME_NAMES };

// Shared building blocks for other terminal widgets (e.g. the stats card).
export {
  THEMES,
  FONT_B64,
  FONT_STACK_BASE,
  DEFAULTS,
  CHROME_H,
  CONTENT_TOP,
  LINE_H,
  PAD_X,
  esc,
  checkColor,
  checkPositiveInt,
  checkBool,
  fontFaceCSS,
};
