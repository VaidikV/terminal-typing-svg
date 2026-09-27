// Terminal-style GitHub stats card. Pure function of fetched data + query
// params -> animated SVG string. No I/O. Shares the terminal chrome, themes,
// and fonts with the typing generator.
//
// Designed to look like real terminal output (neofetch-style): the command
// types, a spinner "fetches" from the API, then stat rows and a colored
// ASCII bar chart print line by line, exactly as a CLI would render them.
import {
  THEMES,
  FONT_STACK_BASE,
  DEFAULTS,
  CHROME_H,
  CONTENT_TOP,
  LINE_H,
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
  ["Stars earned", "stars"],
  ["Repositories", "repos"],
  ["Pull requests", "prs"],
  ["Issues", "issues"],
  ["Followers", "followers"],
];

const FADE = 500;
const RESTART_GAP = 600;
const SPINNER = ["|", "/", "-", "\\"];
const SPIN_STEP = 130;
const SPIN_CYCLES = 2;
const BAR_W = 14; // bar width in characters
const FULL = "\u2588"; // █
const LIGHT = "\u2591"; // ░

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
  const endV = repeat ? "0" : "1";

  const cmd = `gh stats ${data.username}`;
  const promptText = `${p.prompt}:~$ `;
  const promptSpans = [
    [p.prompt, p.t.promptUser],
    [":", p.t.promptDollar],
    ["~", p.t.promptPath],
    ["$ ", p.t.promptDollar],
  ];

  const stats = STAT_DEFS.map(([label, key]) => ({
    label,
    value: Number(data[key] || 0).toLocaleString("en-US"),
  }));
  const langs = (data.langs || []).slice(0, 5).map((l) => ({
    name: String(l.name).slice(0, 24),
    count: Number(l.count) || 0,
    color: langColor(l.name, p.t.accent),
  }));
  const maxLang = Math.max(1, ...langs.map((l) => l.count));
  const nameCol = Math.max(0, ...langs.map((l) => l.name.length));

  const width = Math.max(620, p.minWidth);

  // ---- layout ----
  const yCmd = CONTENT_TOP;
  const yFetch = CONTENT_TOP + LINE_H;
  const yHead = CONTENT_TOP + 2 * LINE_H;
  const yDashes = CONTENT_TOP + 3 * LINE_H;
  const yStat = (i) => CONTENT_TOP + (4 + i) * LINE_H;
  const yLangLabel = CONTENT_TOP + 10 * LINE_H;
  const yLang = (j) => CONTENT_TOP + (11 + j) * LINE_H;
  const yPrompt2 = CONTENT_TOP + (langs.length ? 17 : 11) * LINE_H;
  const height = Math.ceil(yPrompt2 + 44);

  // ---- timeline ----
  const nTypeChars = promptText.length + cmd.length + 1;
  const typeDur = nTypeChars * p.typingSpeed;
  const tFetch = typeDur + 250;
  const fetchDur = SPINNER.length * SPIN_STEP * SPIN_CYCLES;
  const tFetchEnd = tFetch + fetchDur;
  const tHead = tFetchEnd + 120;
  const tStat = (i) => tHead + 180 + i * 140;
  const tLangLabel = tStat(stats.length - 1) + 300;
  const tLang = (j) => tLangLabel + 180 + j * 170;
  const tPrompt2 = langs.length ? tLang(langs.length - 1) + 400 : tStat(stats.length - 1) + 400;
  const contentEnd = tPrompt2 + 200;
  const totalDur = contentEnd + hold + FADE;
  const k = (t) => (t / totalDur).toFixed(4);
  const kOut = k(totalDur - FADE);

  const win = (tIn, dur) => ({
    values: `0;0;1;1;${endV}`,
    keyTimes: `0;${k(tIn)};${k(tIn + dur)};${kOut};1`,
  });

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

  parts.push(
    `  <g>\n` +
      `    <animate id="outro" attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
      `      values="1;1;${endV}" keyTimes="0;${kOut};1"/>`
  );

  // Typed command.
  const fullLen = nTypeChars * p.adv + 14;
  const d0 = `M ${PAD_X},${yCmd} h0`;
  const d1 = `M ${PAD_X},${yCmd} h${fullLen.toFixed(1)}`;
  const begin = repeat ? `0s;outro.end+${RESTART_GAP}ms` : "0s";
  const tspans =
    promptSpans.map(([txt, c]) => `<tspan fill="${c}">${esc(txt)}</tspan>`).join("") +
    `<tspan fill="${p.t.command}" font-weight="600">${esc(cmd)}</tspan>` +
    `<tspan fill="${p.t.accent}">\u2588` +
    `<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" ` +
    `dur="1.06s" repeatCount="indefinite" ` +
    `begin="tpa0.begin+${typeDur}ms" end="tpa0.begin+${tFetch}ms"/>` +
    `</tspan>`;
  parts.push(
    `    <path id="tp0" d="${d0}" fill="none">\n` +
      `      <animate id="tpa0" attributeName="d" begin="${begin}" dur="${totalDur}ms" fill="freeze"\n` +
      `        values="${d0} ; ${d1} ; ${d1}" keyTimes="0;${k(typeDur)};1"/>\n` +
      `    </path>\n` +
      `    <text font-family="${stack}" font-size="${p.fontSize}">\n` +
      `      <textPath xlink:href="#tp0" href="#tp0">${tspans}</textPath>\n` +
      `    </text>`
  );

  // Spinner + fetching line (vanishes when output prints).
  const tHideFetch = tHead;
  parts.push(`    <g opacity="0">\n` +
    `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
    `        values="0;0;1;1;0;0" keyTimes="0;${k(tFetch)};${k(tFetch + 80)};${k(tHideFetch)};${k(tHideFetch + 250)};1"/>\n` +
    `      <text x="${PAD_X}" y="${yFetch}" font-family="${stack}" font-size="${p.fontSize}" fill="${p.t.output}">fetching stats from api.github.com </text>`);
  SPINNER.forEach((ch, f) => {
    const times = [];
    for (let r = 0; r < SPIN_CYCLES; r++) {
      times.push(k(tFetch + (r * SPINNER.length + f) * SPIN_STEP));
      times.push(k(tFetch + (r * SPINNER.length + f + 1) * SPIN_STEP));
    }
    parts.push(
      `      <text x="${PAD_X + 34 * p.adv}" y="${yFetch}" font-family="${stack}" font-size="${p.fontSize}" font-weight="600" fill="${p.t.accent}" opacity="0">${ch === "\\" ? "&#92;" : ch}\n` +
        `        <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
        `          calcMode="discrete" values="0;1;0;1;0;0" keyTimes="0;${times[0]};${times[1]};${times[2]};${times[3]};1"/>\n` +
        `      </text>`
    );
  });
  parts.push("    </g>");

  // neofetch-style header: user@host + dashes.
  const hw = win(tHead, 120);
  const dashes = "-".repeat(p.prompt.length);
  parts.push(
    `    <g opacity="0">\n` +
      `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
      `        values="${hw.values}" keyTimes="${hw.keyTimes}"/>\n` +
      `      <text x="${PAD_X}" y="${yHead}" font-family="${stack}" font-size="${p.fontSize}" font-weight="600" fill="${p.t.promptUser}">${esc(p.prompt)}</text>\n` +
      `      <text x="${PAD_X}" y="${yDashes}" font-family="${stack}" font-size="${p.fontSize}" fill="${p.t.divider}">${dashes}</text>\n` +
      `    </g>`
  );

  // Stat rows print like real command output: "Label: value".
  stats.forEach((s, i) => {
    const w = win(tStat(i), 70);
    parts.push(
      `    <g opacity="0">\n` +
        `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
        `        values="${w.values}" keyTimes="${w.keyTimes}"/>\n` +
        `      <text x="${PAD_X}" y="${yStat(i)}" font-family="${stack}" font-size="${p.fontSize}">` +
        `<tspan fill="${p.t.output}">${esc(s.label)}: </tspan>` +
        `<tspan fill="${p.t.accent}" font-weight="600">${esc(s.value)}</tspan></text>\n` +
        `    </g>`
    );
  });

  // Top languages as a colored ASCII bar chart, exactly like a CLI would draw.
  if (langs.length) {
    const lw = win(tLangLabel, 120);
    parts.push(
      `    <g opacity="0">\n` +
        `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
        `        values="${lw.values}" keyTimes="${lw.keyTimes}"/>\n` +
        `      <text x="${PAD_X}" y="${yLangLabel}" font-family="${stack}" font-size="${p.fontSize}" font-weight="600" fill="${p.t.output}">Top languages</text>\n` +
        `    </g>`
    );
    langs.forEach((l, j) => {
      const filled = Math.max(1, Math.round((l.count / maxLang) * BAR_W));
      const bar = FULL.repeat(filled) + LIGHT.repeat(BAR_W - filled);
      const namePad = " ".repeat(nameCol - l.name.length);
      const w = win(tLang(j), 70);
      parts.push(
        `    <g opacity="0">\n` +
          `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
          `        values="${w.values}" keyTimes="${w.keyTimes}"/>\n` +
          `      <text x="${PAD_X}" y="${yLang(j)}" font-family="${stack}" font-size="${p.fontSize}">` +
          `<tspan fill="${p.t.output}">${esc(l.name)}${namePad}  </tspan>` +
          `<tspan fill="${l.color}">${bar}</tspan>` +
          `<tspan fill="${p.t.accent}" font-weight="600"> ${l.count}</tspan></text>\n` +
          `    </g>`
      );
    });
  }

  // Fresh prompt, terminal ready for the next command.
  const pw = win(tPrompt2, 200);
  const p2spans =
    promptSpans.map(([txt, c]) => `<tspan fill="${c}">${esc(txt)}</tspan>`).join("") +
    `<tspan fill="${p.t.accent}">\u2588` +
    `<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" ` +
    `dur="1.06s" repeatCount="indefinite" ` +
    `begin="tpa0.begin+${tPrompt2}ms" end="tpa0.begin+${totalDur - FADE}ms"/>` +
    `</tspan>`;
  parts.push(
    `    <g opacity="0">\n` +
      `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
      `        values="${pw.values}" keyTimes="${pw.keyTimes}"/>\n` +
      `      <text x="${PAD_X}" y="${yPrompt2}" font-family="${stack}" font-size="${p.fontSize}">${p2spans}</text>\n` +
      `    </g>`
  );

  parts.push("  </g>");
  parts.push("</svg>");
  return { svg: parts.join("\n") + "\n" };
}
