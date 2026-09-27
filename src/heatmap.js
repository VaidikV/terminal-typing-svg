// Contribution heatmap card. Pure function of parsed contribution days ->
// SVG string. No I/O. Days: [{date: "YYYY-MM-DD", count, level}].
// Level is GitHub's 0-4 intensity bucket; count is the exact contributions.
// Layout: stats panel on the left, contribution grid on the right with a
// gradient fade dissolving it into the card. Uses a system sans stack on
// purpose: this card is not a terminal.
import { buildParams, esc } from "./generator.js";

const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
const DARK_SCALE = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const LIGHT_SCALE = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const WEEKS = 16;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const iso = (d) => d.toISOString().slice(0, 10);

export function generateHeatmapSVG(username, days, rawQuery) {
  const p = buildParams(rawQuery);
  const scale = luminance(p.t.bg1) < 0.5 ? DARK_SCALE : LIGHT_SCALE;
  const byDate = new Map(days.map((d) => [d.date, d]));

  // Group into Sunday-start weeks, keep the most recent 16.
  const weekStart = (ds) => {
    const d = new Date(ds + "T00:00:00");
    d.setDate(d.getDate() - d.getDay());
    return iso(d);
  };
  const keys = [...new Set(days.map((d) => weekStart(d.date)))].sort().slice(-WEEKS);
  const grid = keys.map((wk) => {
    const cells = [];
    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(wk + "T00:00:00");
      d.setDate(d.getDate() + dow);
      cells.push(byDate.get(iso(d)) || null);
    }
    return cells;
  });

  // Month labels where the month changes between week columns.
  let prevMonth = -1;
  const labels = [];
  keys.forEach((wk, ci) => {
    const m = new Date(wk + "T00:00:00").getMonth();
    if (m !== prevMonth) {
      prevMonth = m;
      labels.push({ ci, text: MONTHS[m] });
    }
  });

  // Stats: total + streak + active days over the visible window.
  const flat = grid.flat().filter(Boolean);
  const total = flat.reduce((s, c) => s + c.count, 0);
  const activeDays = flat.filter((c) => c.count > 0).length;
  let streak = 0;
  const cursor = new Date(days[days.length - 1].date + "T00:00:00");
  if ((byDate.get(iso(cursor)) || { count: 0 }).count === 0) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while ((byDate.get(iso(cursor)) || { count: 0 }).count > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const stats = [
    { value: total.toLocaleString("en-US"), label: "contributions" },
    { value: String(streak), label: "day streak" },
    { value: String(activeDays), label: "active days" },
  ];

  // Layout: stats left, grid right with a fade.
  const sq = 11;
  const gap = 3;
  const step = sq + gap;
  const gridW = WEEKS * step - gap;
  const gridH = 7 * step - gap;
  const pad = 20;
  const statsW = 118;
  const statsX = pad;
  const statTop = pad + 40;
  const blockH = 56;
  const statsBottom = statTop + stats.length * blockH;
  const gridX = statsX + statsW + 30;
  const gy = statTop + Math.max(0, (statsBottom - statTop - gridH) / 2);
  const width = Math.ceil(gridX + gridW + pad);
  const legendY = gy + gridH + 24;
  const height = Math.ceil(Math.max(statsBottom, legendY) + pad);
  const muted = p.t.output;

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}" role="img">`
  );
  parts.push(
    `  <defs>\n` +
      `    <linearGradient id="gridFade" x1="0" y1="0" x2="1" y2="0">\n` +
      `      <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>\n` +
      `      <stop offset="0.62" stop-color="#ffffff" stop-opacity="1"/>\n` +
      `      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>\n` +
      `    </linearGradient>\n` +
      `    <mask id="gridMask">\n` +
      `      <rect x="${gridX}" y="${gy - 20}" width="${gridW}" height="${gridH + 20}" ` +
      `fill="url(#gridFade)"/>\n` +
      `    </mask>\n` +
      `  </defs>`
  );
  parts.push(
    `  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="10" ` +
      `fill="${p.t.bg1}" stroke="${p.t.border}"/>`
  );
  parts.push(
    `  <text x="${pad}" y="${pad + 13}" font-family="${SANS}" font-size="13">` +
      `<tspan font-weight="700" fill="${p.t.title}">${esc(username)}</tspan>` +
      `<tspan fill="${muted}" opacity="0.6"> \u00b7 last ${WEEKS} weeks</tspan></text>`
  );

  // Stats panel.
  stats.forEach((s, i) => {
    const y0 = statTop + i * blockH;
    parts.push(
      `  <text x="${statsX}" y="${y0 + 28}" font-family="${SANS}" font-size="26" ` +
        `font-weight="800" fill="${p.t.title}">${s.value}</text>\n` +
        `  <text x="${statsX}" y="${y0 + 46}" font-family="${SANS}" font-size="11" ` +
        `fill="${muted}" opacity="0.6">${s.label}</text>`
    );
  });

  // Grid, faded into the card.
  parts.push(`  <g mask="url(#gridMask)">`);
  labels.forEach((l) => {
    parts.push(
      `    <text x="${gridX + l.ci * step}" y="${gy - 8}" font-family="${SANS}" ` +
        `font-size="9" fill="${muted}" opacity="0.55">${l.text}</text>`
    );
  });
  grid.forEach((col, ci) => {
    col.forEach((cell, ri) => {
      if (!cell) return;
      parts.push(
        `    <rect x="${gridX + ci * step}" y="${gy + ri * step}" width="${sq}" height="${sq}" ` +
          `rx="2" fill="${scale[Math.min(4, cell.level)]}"/>`
      );
    });
  });
  parts.push(`  </g>`);

  // Less -> More legend.
  let lx = gridX;
  parts.push(
    `  <text x="${lx}" y="${legendY}" font-family="${SANS}" font-size="10" ` +
      `fill="${muted}" opacity="0.6">Less</text>`
  );
  lx += 34;
  scale.forEach((c) => {
    parts.push(`  <rect x="${lx}" y="${legendY - 9}" width="10" height="10" rx="2" fill="${c}"/>`);
    lx += 13;
  });
  parts.push(
    `  <text x="${lx + 2}" y="${legendY}" font-family="${SANS}" font-size="10" ` +
      `fill="${muted}" opacity="0.6">More</text>`
  );

  parts.push("</svg>");
  return { svg: parts.join("\n") + "\n" };
}
