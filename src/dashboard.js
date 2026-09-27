// Minimal dashboard card: oversized numbers, hairline dividers, tiny
// uppercase labels. Linear-style. Pure function of API stats -> SVG.
import { buildParams, esc } from "./generator.js";

const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;

const CELLS = [
  ["Stars", "stars"],
  ["Repositories", "repos"],
  ["Pull requests", "prs"],
  ["Issues", "issues"],
  ["Followers", "followers"],
];

export function generateDashboardSVG(data, rawQuery) {
  const p = buildParams(rawQuery);
  const vals = CELLS.map(([label, key]) => ({
    label: label.toUpperCase(),
    value: Number(data[key] || 0).toLocaleString("en-US"),
  }));

  const pad = 24;
  const colW = 110;
  const width = pad * 2 + colW * vals.length;
  const headerY = pad + 14;
  const valY = headerY + 44;
  const labelY = valY + 24;
  const height = labelY + pad;
  const muted = p.t.output;

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}" role="img">`
  );
  parts.push(
    `  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="10" ` +
      `fill="${p.t.bg1}" stroke="${p.t.border}"/>`
  );
  parts.push(
    `  <text x="${pad}" y="${headerY}" font-family="${SANS}" font-size="13">` +
      `<tspan font-weight="700" fill="${p.t.title}">${esc(data.username || "")}</tspan>` +
      `<tspan fill="${muted}" opacity="0.55"> \u00b7 stats</tspan></text>`
  );
  // Hairline dividers between columns.
  for (let i = 1; i < vals.length; i++) {
    const x = pad + i * colW;
    parts.push(
      `  <line x1="${x}" y1="${headerY + 12}" x2="${x}" y2="${labelY + 4}" ` +
        `stroke="${p.t.divider}" stroke-width="1"/>`
    );
  }
  vals.forEach((v, i) => {
    const x = pad + i * colW;
    parts.push(
      `  <text x="${x}" y="${valY}" font-family="${SANS}" font-size="30" ` +
        `font-weight="800" fill="${p.t.title}">${v.value}</text>\n` +
        `  <text x="${x}" y="${labelY}" font-family="${SANS}" font-size="10" ` +
        `letter-spacing="1.5" fill="${muted}" opacity="0.55">${v.label}</text>`
    );
  });
  parts.push("</svg>");
  return { svg: parts.join("\n") + "\n" };
}
