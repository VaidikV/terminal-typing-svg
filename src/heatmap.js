// Contribution heatmap card. Pure function of parsed contribution days ->
// SVG string. No I/O. Days: [{date: "YYYY-MM-DD", count, level}].
// Level is GitHub's 0-4 intensity bucket; count is the exact contributions.
// Layout (560 x 224, matches the terminal banner width):
//   left   - compact profile stats (stars, PRs, issues)
//   middle - 16x7 grid; its left edge fades in over the first three
//            columns, the right edge (most recent days) stays fully clear
//   right  - headline window stats (contributions, day streak)
// Uses a system sans stack on purpose: this card is not a terminal.
import { buildParams, esc } from "./generator.js";

const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
const DARK_SCALE = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const LIGHT_SCALE = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const WEEKS = 16;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CARD_W = 560;
const CARD_H = 224;
const PAD = 20;
const ROWS_X = PAD;          // left stats column
const GRID_X = 160;          // contribution grid
const NUM_X = 435;           // right headline numbers
const GRID_TOP = 70;
const MONTH_Y = 61.5;
const LEGEND_Y = 190;
const SQ = 11;
const GAP = 3;
const STEP = SQ + GAP;
const GRID_W = WEEKS * STEP - GAP;
const GRID_H = 7 * STEP - GAP;

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
const fmt = (v) => (v == null ? "-" : Number(v).toLocaleString("en-US"));

export function generateHeatmapSVG(username, days, rawQuery, profile) {
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

  // Stats: total + streak over the visible window.
  const flat = grid.flat().filter(Boolean);
  const total = flat.reduce((s, c) => s + c.count, 0);
  let streak = 0;
  const cursor = new Date(days[days.length - 1].date + "T00:00:00");
  if ((byDate.get(iso(cursor)) || { count: 0 }).count === 0) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while ((byDate.get(iso(cursor)) || { count: 0 }).count > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const muted = p.t.output;

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" ` +
      `viewBox="0 0 ${CARD_W} ${CARD_H}" role="img">`
  );
  parts.push(
    `  <defs>\n` +
      // Fade the grid in from its left edge over the first three columns;
      // the right edge (most recent days) stays fully clear.
      `    <linearGradient id="gridFade" gradientUnits="userSpaceOnUse" ` +
      `x1="${GRID_X}" y1="0" x2="${GRID_X + 3 * STEP}" y2="0">\n` +
      `      <stop offset="0" stop-color="#ffffff" stop-opacity="0.4"/>\n` +
      `      <stop offset="1" stop-color="#ffffff" stop-opacity="1"/>\n` +
      `    </linearGradient>\n` +
      `    <mask id="gridMask">\n` +
      `      <rect x="${GRID_X}" y="${GRID_TOP}" width="${GRID_W}" height="${GRID_H}" ` +
      `fill="url(#gridFade)"/>\n` +
      `    </mask>\n` +
      `  </defs>`
  );
  parts.push(
    `  <rect x="1" y="1" width="${CARD_W - 2}" height="${CARD_H - 2}" rx="10" ` +
      // bg2 (the deeper canvas) so empty day squares stay visible, like GitHub.
      `fill="${p.t.bg2}" stroke="${p.t.border}"/>`
  );
  parts.push(
    `  <text x="${PAD}" y="${PAD + 13}" font-family="${SANS}" font-size="13">` +
      `<tspan font-weight="700" fill="${p.t.title}">${esc(username)}</tspan>` +
      `<tspan fill="${muted}" opacity="0.6"> \u00b7 last ${WEEKS} weeks</tspan></text>`
  );

  // Left: compact profile stats, less verbose than the profile card.
  const rows = [
    [profile?.stars, "stars"],
    [profile?.prs, "PRs"],
    [profile?.issues, "issues"],
  ];
  rows.forEach(([value, label], i) => {
    const y = 82 + i * 38;
    parts.push(
      `  <text x="${ROWS_X}" y="${y}" font-family="${SANS}" font-size="15">` +
        `<tspan font-weight="700" fill="${p.t.title}">${fmt(value)}</tspan>` +
        `<tspan font-size="11" fill="${muted}" opacity="0.6"> ${label}</tspan></text>`
    );
  });

  // Middle: month labels above the grid (kept clear, outside the fade).
  labels.forEach((l) => {
    parts.push(
      `  <text x="${GRID_X + l.ci * STEP}" y="${MONTH_Y}" font-family="${SANS}" ` +
        `font-size="9" fill="${muted}" opacity="0.55">${l.text}</text>`
    );
  });

  // Day cells, masked so the left edge fades in.
  parts.push(`  <g mask="url(#gridMask)">`);
  grid.forEach((col, ci) => {
    col.forEach((cell, ri) => {
      if (!cell) return;
      parts.push(
        `    <rect x="${GRID_X + ci * STEP}" y="${GRID_TOP + ri * STEP}" width="${SQ}" height="${SQ}" ` +
          `rx="2" fill="${scale[Math.min(4, cell.level)]}"/>`
      );
    });
  });
  parts.push(`  </g>`);

  // Less -> More legend under the grid.
  let lx = GRID_X;
  parts.push(
    `  <text x="${lx}" y="${LEGEND_Y}" font-family="${SANS}" font-size="10" ` +
      `fill="${muted}" opacity="0.6">Less</text>`
  );
  lx += 34;
  scale.forEach((c) => {
    parts.push(`  <rect x="${lx}" y="${LEGEND_Y - 9}" width="10" height="10" rx="2" fill="${c}"/>`);
    lx += 13;
  });
  parts.push(
    `  <text x="${lx + 2}" y="${LEGEND_Y}" font-family="${SANS}" font-size="10" ` +
      `fill="${muted}" opacity="0.6">More</text>`
  );

  // Right: headline window stats.
  const headline = (value, label, y) =>
    `  <text x="${NUM_X}" y="${y}" font-family="${SANS}" font-size="26" ` +
      `font-weight="800" fill="${p.t.title}">${fmt(value)}</text>\n` +
    `  <text x="${NUM_X}" y="${y + 18}" font-family="${SANS}" font-size="11" ` +
      `fill="${muted}" opacity="0.6">${label}</text>`;
  parts.push(headline(total, "contributions", 96));
  parts.push(headline(streak, "day streak", 152));

  parts.push("</svg>");
  return { svg: parts.join("\n") + "\n" };
}
