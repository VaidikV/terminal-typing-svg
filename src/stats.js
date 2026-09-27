// Terminal-style GitHub stats card. Pure function of fetched data + query
// params -> animated SVG string. No I/O. Shares the terminal chrome, themes,
// and fonts with the typing generator.
//
// Compact two-column layout: the command up top, icon stat rows on the left,
// a colored ASCII top-languages chart on the right, and a fresh prompt with
// a blinking cursor at the bottom. With animate=false everything renders
// statically (only the cursor blinks).
import {
  THEMES,
  FONT_STACK_BASE,
  DEFAULTS,
  CHROME_H,
  PAD_X,
  esc,
  checkPositiveInt,
  checkBool,
  fontFaceCSS,
  buildParams,
} from "./generator.js";

const LANG_COLORS = {
  Python: "#3572A5", TypeScript: "#3178c6", JavaScript: "#f1e05a",
  Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", "C++": "#f34b7d",
  C: "#555555", "C#": "#178600", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", HTML: "#e34c26", CSS: "#563d7c",
  Shell: "#89e051", Dockerfile: "#384d54", Vue: "#41b883", Dart: "#00B4AB",
  "Jupyter Notebook": "#DA5B0B", R: "#198CE7", Scala: "#c22d40",
  Lua: "#000080", Perl: "#0298c3", Haskell: "#5e5086", Elixir: "#6e4a7e",
  Zig: "#ec915c", "Objective-C": "#438eff",
};

const STAT_DEFS = [
  ["Stars earned", "stars", "star"],
  ["Repositories", "repos", "repo"],
  ["Pull requests", "prs", "pr"],
  ["Issues", "issues", "issue"],
  ["Followers", "followers", "person"],
];

const FADE = 500;
const RESTART_GAP = 600;
const BAR_W = 10; // bar width in characters
const FULL = "\u2588"; // █
const LIGHT = "\u2591"; // ░
const ICON = 15; // icon box px

const ICON_PATHS = {
  star: `<polygon points="8,1.5 9.65,5.73 14.18,5.99 10.66,8.87 11.82,13.26 8,10.8 4.18,13.26 5.34,8.87 1.82,5.99 6.35,5.73"/>`,
  repo: `<rect x="2.5" y="2.5" width="11" height="11" rx="2"/>`,
  pr: `<circle cx="4.5" cy="4.5" r="2"/><circle cx="4.5" cy="11.5" r="2"/><circle cx="11.5" cy="8" r="2"/><path d="M4.5 6.5v3"/><path d="M6.4 5.2C8.2 5.8 8.6 6.6 9.6 7.2"/>`,
  issue: `<circle cx="8" cy="8" r="5.5"/><path d="M8 5.2v3.2"/><circle cx="8" cy="11.2" r="1.1" fill="ACCENT" stroke="none"/>`,
  person: `<circle cx="8" cy="5.3" r="2.6"/><path d="M3.2 13.6c.6-3 2.4-4.4 4.8-4.4s4.2 1.4 4.8 4.4"/>`,
};

export function langColor(name, fallback) {
  return LANG_COLORS[name] || fallback;
}

export function generateStatsSVG(data, rawQuery, opts = {}) {
  const fontFamily = (opts.fontFamily || "JetBrains Mono").replace(/["<>]/g, "");
  const stack = `'${fontFamily}', ${FONT_STACK_BASE}`;
  const p = buildParams(rawQuery);
  const q = rawQuery instanceof URLSearchParams ? rawQuery : new URLSearchParams(rawQuery);
  const repeat = checkBool(q.get("repeat"), DEFAULTS.repeat);
  const hold = checkPositiveInt(q.get("hold"), 4000);
  const animated = checkBool(q.get("animate"), true);
  const endV = repeat ? "0" : "1";
  const fs = p.fontSize;
  const adv = fs * 0.6;

  const cmd = `gh stats ${data.username}`;
  const promptText = `${p.prompt}:~$ `;
  const promptSpans = [
    [p.prompt, p.t.promptUser],
    [":", p.t.promptDollar],
    ["~", p.t.promptPath],
    ["$ ", p.t.promptDollar],
  ];
  const promptTspans = (cursor) =>
    promptSpans.map(([txt, c]) => `<tspan fill="${c}">${esc(txt)}</tspan>`).join("") + cursor;

  const stats = STAT_DEFS.map(([label, key, icon]) => ({
    label,
    icon,
    value: Number(data[key] || 0).toLocaleString("en-US"),
  }));
  const langs = (data.langs || []).slice(0, 5).map((l) => ({
    name: String(l.name).slice(0, 24),
    count: Number(l.count) || 0,
    color: langColor(l.name, p.t.accent),
  }));
  const maxLang = Math.max(1, ...langs.map((l) => l.count));
  const nameCol = Math.max(0, ...langs.map((l) => l.name.length));

  // ---- layout ----
  const COL2_X = 300;
  const yCmd = 72;
  const yStat = (i) => 102 + i * 26;
  const yLangLabel = 102;
  const yLang = (j) => 128 + j * 26;
  const yPrompt2 = 258;
  const height = yPrompt2 + 34;

  const labelX = PAD_X + ICON + 9;
  const maxLabelW = Math.max(...stats.map((s) => s.label.length)) * adv;
  const valueX = Math.ceil(labelX + maxLabelW + 18);
  const barX = COL2_X + nameCol * adv + 12;
  const countX = Math.ceil(barX + (BAR_W + 1) * adv + 10);
  const width = Math.max(560, p.minWidth, Math.ceil(countX + 28));

  // ---- timeline (animated mode) ----
  const nTypeChars = promptText.length + cmd.length + 1;
  const typeDur = nTypeChars * p.typingSpeed;
  const tStat = (i) => typeDur + 250 + i * 130;
  const tLangLabel = tStat(stats.length - 1) + 250;
  const tLang = (j) => tLangLabel + 150 + j * 130;
  const tPrompt2 = langs.length ? tLang(langs.length - 1) + 300 : tStat(stats.length - 1) + 300;
  const contentEnd = tPrompt2 + 150;
  const totalDur = contentEnd + hold + FADE;
  const k = (t) => (t / totalDur).toFixed(4);
  const kOut = k(totalDur - FADE);

  // A content group: staged reveal when animated, plain when static.
  const show = (inner, tIn, dur = 70) => {
    if (!animated) return `    <g>\n${inner}\n    </g>`;
    const values = `0;0;1;1;${endV}`;
    const keyTimes = `0;${k(tIn)};${k(tIn + dur)};${kOut};1`;
    return (
      `    <g opacity="0">\n` +
      `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
      `        values="${values}" keyTimes="${keyTimes}"/>\n${inner}\n    </g>`
    );
  };

  const iconSvg = (name, x, y) =>
    `<svg x="${x}" y="${y}" width="${ICON}" height="${ICON}" viewBox="0 0 16 16" fill="none" ` +
    `stroke="${p.t.accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
    ICON_PATHS[name].replaceAll("ACCENT", p.t.accent) +
    `</svg>`;

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

  if (animated) {
    parts.push(
      `  <g>\n` +
        `    <animate id="outro" attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
        `      values="1;1;${endV}" keyTimes="0;${kOut};1"/>`
    );
  } else {
    parts.push("  <g>");
  }

  // Command line: typed via textPath when animated, plain text when static.
  if (animated) {
    const fullLen = nTypeChars * adv + 14;
    const d0 = `M ${PAD_X},${yCmd} h0`;
    const d1 = `M ${PAD_X},${yCmd} h${fullLen.toFixed(1)}`;
    const begin = repeat ? `0s;outro.end+${RESTART_GAP}ms` : "0s";
    const tspans =
      promptTspans("") +
      `<tspan fill="${p.t.command}" font-weight="600">${esc(cmd)}</tspan>` +
      `<tspan fill="${p.t.accent}">\u2588` +
      `<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" ` +
      `dur="1.06s" repeatCount="indefinite" ` +
      `begin="tpa0.begin+${typeDur}ms" end="tpa0.begin+${typeDur + 250}ms"/>` +
      `</tspan>`;
    parts.push(
      `    <path id="tp0" d="${d0}" fill="none">\n` +
        `      <animate id="tpa0" attributeName="d" begin="${begin}" dur="${totalDur}ms" fill="freeze"\n` +
        `        values="${d0} ; ${d1} ; ${d1}" keyTimes="0;${k(typeDur)};1"/>\n` +
        `    </path>\n` +
        `    <text font-family="${stack}" font-size="${fs}">\n` +
        `      <textPath xlink:href="#tp0" href="#tp0">${tspans}</textPath>\n` +
        `    </text>`
    );
  } else {
    parts.push(
      `    <text x="${PAD_X}" y="${yCmd}" font-family="${stack}" font-size="${fs}">` +
        promptTspans("") +
        `<tspan fill="${p.t.command}" font-weight="600">${esc(cmd)}</tspan></text>`
    );
  }

  // Stat rows with icons.
  stats.forEach((s, i) => {
    parts.push(show(
      `      ${iconSvg(s.icon, PAD_X, yStat(i) - 12)}\n` +
        `      <text x="${labelX}" y="${yStat(i)}" font-family="${stack}" font-size="${fs}">` +
        `<tspan fill="${p.t.output}">${esc(s.label)}</tspan></text>\n` +
        `      <text x="${valueX}" y="${yStat(i)}" font-family="${stack}" font-size="${fs}" font-weight="600" fill="${p.t.accent}">${esc(s.value)}</text>`,
      tStat(i)
    ));
  });

  // Top languages chart on the right.
  if (langs.length) {
    parts.push(show(
      `      <text x="${COL2_X}" y="${yLangLabel}" font-family="${stack}" font-size="${fs}" font-weight="600" fill="${p.t.output}">Top languages</text>`,
      tLangLabel, 120
    ));
    langs.forEach((l, j) => {
      const filled = Math.max(1, Math.round((l.count / maxLang) * BAR_W));
      const bar = FULL.repeat(filled) + LIGHT.repeat(BAR_W - filled);
      const namePad = " ".repeat(nameCol - l.name.length);
      parts.push(show(
        `      <text x="${COL2_X}" y="${yLang(j)}" font-family="${stack}" font-size="${fs}">` +
          `<tspan fill="${p.t.output}">${esc(l.name)}${namePad}  </tspan>` +
          `<tspan fill="${l.color}">${bar}</tspan>` +
          `<tspan fill="${p.t.accent}" font-weight="600"> ${l.count}</tspan></text>`,
        tLang(j)
      ));
    });
  }

  // Fresh prompt with blinking cursor.
  const cursorBegin = animated ? `tpa0.begin+${tPrompt2}ms` : "0s";
  const cursorEnd = animated ? ` end="tpa0.begin+${totalDur - FADE}ms"` : "";
  const cursor =
    `<tspan fill="${p.t.accent}">\u2588` +
    `<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" ` +
    `dur="1.06s" repeatCount="indefinite" begin="${cursorBegin}"${cursorEnd}/>` +
    `</tspan>`;
  parts.push(show(
    `      <text x="${PAD_X}" y="${yPrompt2}" font-family="${stack}" font-size="${fs}">${promptTspans(cursor)}</text>`,
    tPrompt2, 200
  ));

  parts.push("  </g>");
  parts.push("</svg>");
  return { svg: parts.join("\n") + "\n" };
}
