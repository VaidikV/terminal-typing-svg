// Contribution heatmap card. Pure function of parsed contribution days ->
// animated SVG string. No I/O. Days: [{date: "YYYY-MM-DD", count, level}].
// Level is GitHub's 0-4 intensity bucket; count is the exact contributions.
// Uses a system sans stack on purpose: this card is not a terminal.
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

  // Totals over the visible window; streak over all data.
  const total = grid.flat().reduce((s, c) => s + (c ? c.count : 0), 0);
  let streak = 0;
  const cursor = new Date(days[days.length - 1].date + "T00:00:00");
  if ((byDate.get(iso(cursor)) || { count: 0 }).count === 0) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while ((byDate.get(iso(cursor)) || { count: 0 }).count > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Layout.
  const sq = 11;
  const gap = 3;
  const step = sq + gap;
  const gridW = WEEKS * step - gap;
  const gridH = 7 * step - gap;
  const pad = 20;
  const gy = pad + 48;
  const statsX = pad + gridW + 30;
  const width = Math.ceil(statsX + 118);
  const legendY = gy + gridH + 26;
  const height = Math.ceil(legendY + 22);
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
    `  <text x="${pad}" y="${pad + 13}" font-family="${SANS}" font-size="13">` +
      `<tspan font-weight="700" fill="${p.t.title}">${esc(username)}</tspan>` +
      `<tspan fill="${muted}" opacity="0.6"> \u00b7 contributions \u00b7 last ${WEEKS} weeks</tspan></text>`
  );
  labels.forEach((l) => {
    parts.push(
      `  <text x="${pad + l.ci * step}" y="${pad + 37}" font-family="${SANS}" ` +
        `font-size="9" fill="${muted}" opacity="0.55">${l.text}</text>`
    );
  });
  grid.forEach((col, ci) => {
    col.forEach((cell, ri) => {
      if (!cell) return;
      parts.push(
        `  <rect x="${pad + ci * step}" y="${gy + ri * step}" width="${sq}" height="${sq}" ` +
          `rx="2" fill="${scale[Math.min(4, cell.level)]}"/>`
      );
    });
  });

  // Stats column.
  parts.push(
    `  <text x="${statsX}" y="${gy + 38}" font-family="${SANS}" font-size="30" ` +
      `font-weight="800" fill="${p.t.title}">${total.toLocaleString("en-US")}</text>\n` +
      `  <text x="${statsX}" y="${gy + 56}" font-family="${SANS}" font-size="11" ` +
      `fill="${muted}" opacity="0.6">contributions</text>\n` +
      `  <text x="${statsX}" y="${gy + 92}" font-family="${SANS}" font-size="17" ` +
      `font-weight="700" fill="${p.t.accent}">${streak}</text>\n` +
      `  <text x="${statsX}" y="${gy + 108}" font-family="${SANS}" font-size="11" ` +
      `fill="${muted}" opacity="0.6">day streak</text>`
  );

  // Less -> More legend.
  let lx = pad;
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
