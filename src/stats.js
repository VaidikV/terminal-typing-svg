// Terminal-style GitHub stats card. Pure function of fetched data + query
// params -> animated SVG string. No I/O. Shares the terminal chrome, themes,
// and fonts with the typing generator.
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

const STAT_LEAD = 250;
const STAT_STAGGER = 280;
const STAT_DUR = 350;
const BAR_STAGGER = 160;
const BAR_DUR = 550;
const MAX_BAR_W = 200;
const FADE = 400;
const RESTART_GAP = 500;
const LABEL_X = PAD_X;
const VALUE_X = PAD_X + 190;

export function langColor(name, fallback) {
  return LANG_COLORS[name] || fallback;
}

export function generateStatsSVG(data, rawQuery, opts = {}) {
  const fontFamily = (opts.fontFamily || "JetBrains Mono").replace(/["<>]/g, "");
  const stack = `'${fontFamily}', ${FONT_STACK_BASE}`;
  const p = buildParams(rawQuery);
  const repeat = checkBool(
    rawQuery instanceof URLSearchParams
      ? rawQuery.get("repeat")
      : new URLSearchParams(rawQuery).get("repeat"),
    DEFAULTS.repeat
  );
  const hold = checkPositiveInt(
    rawQuery instanceof URLSearchParams
      ? rawQuery.get("hold")
      : new URLSearchParams(rawQuery).get("hold"),
    3500
  );
  const endV = repeat ? "0" : "1"; // tail value for looping vs frozen

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

  const lines =
    1 + stats.length + 1 + (langs.length ? 1 + langs.length : 0);

  // Language section columns sized from the longest language name so the
  // count and bars never overlap the labels.
  const BAR_H = 10;
  const maxNameW = Math.max(0, ...langs.map((l) => l.name.length)) * p.adv;
  const langCountX = Math.ceil(PAD_X + maxNameW + 20);
  const barX = Math.ceil(langCountX + 56);

  const width = Math.max(
    p.minWidth,
    480,
    Math.ceil(barX + MAX_BAR_W + PAD_X),
    Math.ceil(
      Math.max(
        promptText.length + cmd.length + 1,
        ...stats.map((s) => s.label.length + s.value.length + 30)
      ) * p.adv + PAD_X * 2
    )
  );
  const height = CHROME_H + lines * LINE_H + 26;

  // ---- timeline ----
  const nTypeChars = promptText.length + cmd.length + 1;
  const typeDur = nTypeChars * p.typingSpeed;
  const statAt = (i) => typeDur + STAT_LEAD + i * STAT_STAGGER;
  const langLabelAt = typeDur + STAT_LEAD + stats.length * STAT_STAGGER;
  const barAt = (j) => langLabelAt + 220 + j * BAR_STAGGER;
  const contentEnd = langs.length
    ? barAt(langs.length - 1) + BAR_DUR
    : statAt(stats.length - 1) + STAT_DUR;
  const totalDur = contentEnd + hold + FADE;
  const kType = typeDur / totalDur;
  const kOut = (totalDur - FADE) / totalDur;

  const fadeVals = (tIn) => {
    const a = (tIn / totalDur).toFixed(4);
    const b = ((tIn + STAT_DUR) / totalDur).toFixed(4);
    return { values: `0;0;1;1;${endV}`, keyTimes: `0;${a};${b};${kOut.toFixed(4)};1` };
  };

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

  // Everything below fades out together at the end of each loop.
  parts.push(
    `  <g>\n` +
      `    <animate id="outro" attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
      `      values="1;1;${endV}" keyTimes="0;${kOut.toFixed(4)};1"/>`
  );

  // Typed command.
  const y0 = CONTENT_TOP;
  const fullLen = nTypeChars * p.adv + 14;
  const d0 = `M ${PAD_X},${y0} h0`;
  const d1 = `M ${PAD_X},${y0} h${fullLen.toFixed(1)}`;
  const begin = repeat ? `0s;outro.end+${RESTART_GAP}ms` : "0s";
  const tspans =
    promptSpans.map(([txt, c]) => `<tspan fill="${c}">${esc(txt)}</tspan>`).join("") +
    `<tspan fill="${p.t.command}" font-weight="600">${esc(cmd)}</tspan>` +
    `<tspan fill="${p.t.accent}">\u2588` +
    `<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" ` +
    `dur="1.06s" repeatCount="indefinite" ` +
    `begin="tpa0.begin+${typeDur}ms" end="tpa0.begin+${totalDur - FADE}ms"/>` +
    `</tspan>`;
  parts.push(
    `    <path id="tp0" d="${d0}" fill="none">\n` +
      `      <animate id="tpa0" attributeName="d" begin="${begin}" dur="${totalDur}ms" fill="freeze"\n` +
      `        values="${d0} ; ${d1} ; ${d1}" keyTimes="0;${kType.toFixed(4)};1"/>\n` +
      `    </path>\n` +
      `    <text font-family="${stack}" font-size="${p.fontSize}">\n` +
      `      <textPath xlink:href="#tp0" href="#tp0">${tspans}</textPath>\n` +
      `    </text>`
  );

  // Stat rows, staggered fade-in.
  stats.forEach((s, i) => {
    const y = CONTENT_TOP + (i + 1) * LINE_H;
    const f = fadeVals(statAt(i));
    parts.push(
      `    <g opacity="0">\n` +
        `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
        `        values="${f.values}" keyTimes="${f.keyTimes}"/>\n` +
        `      <text x="${LABEL_X}" y="${y}" font-family="${stack}" font-size="${p.fontSize}" fill="${p.t.output}">${esc(s.label)}</text>\n` +
        `      <text x="${VALUE_X}" y="${y}" font-family="${stack}" font-size="${p.fontSize}" font-weight="600" fill="${p.t.accent}">${esc(s.value)}</text>\n` +
        `    </g>`
    );
  });

  // Top-languages section.
  if (langs.length) {
    const ly = CONTENT_TOP + (stats.length + 2) * LINE_H;
    const f = fadeVals(langLabelAt);
    parts.push(
      `    <g opacity="0">\n` +
        `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
        `        values="${f.values}" keyTimes="${f.keyTimes}"/>\n` +
        `      <text x="${LABEL_X}" y="${ly}" font-family="${stack}" font-size="${p.fontSize}" fill="${p.t.output}">Top languages</text>\n` +
        `    </g>`
    );
    langs.forEach((l, j) => {
      const y = CONTENT_TOP + (stats.length + 3 + j) * LINE_H;
      const w = Math.max(8, Math.round((l.count / maxLang) * MAX_BAR_W));
      const tIn = barAt(j);
      const a = (tIn / totalDur).toFixed(4);
      const b = ((tIn + BAR_DUR) / totalDur).toFixed(4);
      const f2 = fadeVals(tIn);
      parts.push(
        `    <g opacity="0">\n` +
          `      <animate attributeName="opacity" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
          `        values="${f2.values}" keyTimes="${f2.keyTimes}"/>\n` +
          `      <text x="${LABEL_X}" y="${y}" font-family="${stack}" font-size="${p.fontSize}" fill="${p.t.output}">${esc(l.name)}</text>\n` +
          `      <text x="${langCountX}" y="${y}" font-family="${stack}" font-size="${p.fontSize}" font-weight="600" fill="${p.t.accent}">${l.count}</text>\n` +
          `      <rect x="${barX}" y="${y - BAR_H + 2}" width="${MAX_BAR_W}" height="${BAR_H}" rx="5" fill="${p.t.divider}" opacity="0.45"/>\n` +
          `      <rect x="${barX}" y="${y - BAR_H + 2}" width="0" height="${BAR_H}" rx="5" fill="${l.color}">\n` +
          `        <animate attributeName="width" begin="tpa0.begin" dur="${totalDur}ms" fill="freeze"\n` +
          `          values="0;0;${w};${w};${repeat ? 0 : w}" keyTimes="0;${a};${b};${kOut.toFixed(4)};1"/>\n` +
          `      </rect>\n` +
          `    </g>`
      );
    });
  }

  parts.push("  </g>");
  parts.push("</svg>");
  return { svg: parts.join("\n") + "\n" };
}
