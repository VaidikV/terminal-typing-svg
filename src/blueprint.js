// Blueprint card: engineering-drawing aesthetic. Fixed palette, thin white
// linework, dotted leaders, corner registration marks, and a title block.
// Pure function of API stats -> SVG.
import { esc } from "./generator.js";

const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`;

const BG = "#0f3d7a";
const INK = "#ffffff";

const ROWS = [
  ["01", "STARS EARNED", "stars"],
  ["02", "REPOSITORIES", "repos"],
  ["03", "PULL REQUESTS", "prs"],
  ["04", "ISSUES", "issues"],
  ["05", "FOLLOWERS", "followers"],
];

export function generateBlueprintSVG(data, rawQuery) {
  const width = 560;
  const height = 372;
  const pad = 30;
  const user = esc((data.username || "").toUpperCase());

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}" role="img">`
  );
  parts.push(`  <rect width="${width}" height="${height}" rx="10" fill="${BG}"/>`);

  // Graph-paper grid.
  for (let x = 28; x < width; x += 28) {
    parts.push(
      `  <line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${INK}" stroke-opacity="0.05"/>`
    );
  }
  for (let y = 28; y < height; y += 28) {
    parts.push(
      `  <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${INK}" stroke-opacity="0.05"/>`
    );
  }

  // Sheet borders.
  parts.push(
    `  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="6" ` +
      `fill="none" stroke="${INK}" stroke-opacity="0.85" stroke-width="1.5"/>\n` +
      `  <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="4" ` +
      `fill="none" stroke="${INK}" stroke-opacity="0.3"/>`
  );

  // Corner registration marks.
  const mark = (x, y) =>
    `  <path d="M ${x - 7} ${y} H ${x + 7} M ${x} ${y - 7} V ${y + 7}" ` +
    `stroke="${INK}" stroke-opacity="0.7" stroke-width="1"/>`;
  parts.push(mark(30, 30) + "\n" + mark(width - 30, 30) + "\n" + mark(30, height - 30) + "\n" + mark(width - 30, height - 30));

  // Title.
  parts.push(
    `  <text x="${pad}" y="62" font-family="${MONO}" font-size="15" font-weight="700" ` +
      `letter-spacing="4" fill="${INK}">GITHUB STATISTICS</text>\n` +
      `  <text x="${pad}" y="82" font-family="${MONO}" font-size="10" letter-spacing="2" ` +
      `fill="${INK}" opacity="0.6">${user} \u00b7 PUBLIC RECORD</text>`
  );

  // Spec rows with dotted leaders.
  const leaderX1 = 300;
  const valueX = width - pad;
  ROWS.forEach(([idx, label, key], i) => {
    const y = 124 + i * 36;
    const value = Number(data[key] || 0).toLocaleString("en-US");
    parts.push(
      `  <text x="${pad}" y="${y}" font-family="${MONO}" font-size="11" ` +
        `fill="${INK}" opacity="0.5">${idx}</text>\n` +
        `  <text x="${pad + 40}" y="${y}" font-family="${MONO}" font-size="13" ` +
        `font-weight="600" letter-spacing="2" fill="${INK}">${label}</text>\n` +
        `  <line x1="${leaderX1}" y1="${y - 4}" x2="${valueX - 72}" y2="${y - 4}" ` +
        `stroke="${INK}" stroke-opacity="0.4" stroke-dasharray="2 5"/>\n` +
        `  <text x="${valueX}" y="${y}" text-anchor="end" font-family="${MONO}" ` +
        `font-size="15" font-weight="700" fill="${INK}">${value}</text>`
    );
  });

  // Title block.
  const tbX = width - pad - 190;
  const tbY = height - 92;
  const tbW = 190;
  const tbH = 62;
  parts.push(
    `  <rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH}" fill="none" ` +
      `stroke="${INK}" stroke-opacity="0.8"/>\n` +
      `  <line x1="${tbX}" y1="${tbY + 21}" x2="${tbX + tbW}" y2="${tbY + 21}" ` +
      `stroke="${INK}" stroke-opacity="0.8"/>\n` +
      `  <line x1="${tbX}" y1="${tbY + 42}" x2="${tbX + tbW}" y2="${tbY + 42}" ` +
      `stroke="${INK}" stroke-opacity="0.8"/>\n` +
      `  <text x="${tbX + 10}" y="${tbY + 14}" font-family="${MONO}" font-size="9" ` +
      `letter-spacing="1" fill="${INK}" opacity="0.75">PROJECT \u00b7 GITHUB STATS</text>\n` +
      `  <text x="${tbX + 10}" y="${tbY + 35}" font-family="${MONO}" font-size="9" ` +
      `letter-spacing="1" fill="${INK}" opacity="0.75">DRAWN \u00b7 ${user}</text>\n` +
      `  <text x="${tbX + 10}" y="${tbY + 56}" font-family="${MONO}" font-size="9" ` +
      `letter-spacing="1" fill="${INK}" opacity="0.75">SCALE 1:1 \u00b7 SHEET 01/01</text>`
  );
  parts.push(
    `  <text x="${pad}" y="${height - 40}" font-family="${MONO}" font-size="9" ` +
      `letter-spacing="1" fill="${INK}" opacity="0.45">DO NOT SCALE DRAWING</text>`
  );

  parts.push("</svg>");
  return { svg: parts.join("\n") + "\n" };
}
