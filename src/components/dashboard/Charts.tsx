import { useId } from "react";

// ── Shared palette ───────────────────────────────────────────────────────────
export const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#84cc16",
];

export const PLAN_CHART_COLORS: Record<string, string> = {
  FREE: "#71717a",
  SILVER: "#a1a1aa",
  GOLD: "#f59e0b",
  DIAMOND: "#22d3ee",
};

const fmt = (v: number) => v.toLocaleString();

// ── Area / line chart (SVG, no deps) ──────────────────────────────────────────
export function AreaChart({
  data,
  height = 190,
  color = "#6366f1",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const gradId = useId();
  const w = 600;
  const padL = 46;
  const padR = 10;
  const padT = 14;
  const padB = 24;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);

  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({
    x: padL + i * step,
    y: padT + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area =
    `${padL},${padT + innerH} ${line} ${padL + innerW},${padT + innerH}`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: padT + innerH - f * innerH,
    v: max * f,
  }));
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="Trend chart"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={w - padR}
            y1={t.y}
            y2={t.y}
            stroke="rgba(255,255,255,0.06)"
          />
          <text
            x={padL - 6}
            y={t.y + 3}
            textAnchor="end"
            fontSize="9"
            fill="#71717a"
          >
            {fmt(Math.round(t.v))}
          </text>
        </g>
      ))}

      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pts.map(
        (p, i) =>
          (i % labelEvery === 0 || i === pts.length - 1) && (
            <text
              key={i}
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              fontSize="8"
              fill="#71717a"
            >
              {p.label}
            </text>
          )
      )}

      {pts.map((p, i) => (
        <title key={i}>{`${p.label}: ${fmt(p.value)}`}</title>
      ))}
    </svg>
  );
}

// ── Bar chart (HTML/CSS) ──────────────────────────────────────────────────────
export function BarChart({
  data,
  height = 150,
  color = "#6366f1",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 h-full flex flex-col justify-end rounded-t overflow-hidden"
            title={`${d.label}: ${fmt(d.value)}`}
          >
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                backgroundColor: color,
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1.5">
        {data.map((d, i) => (
          <span
            key={i}
            className="flex-1 text-center text-[8px] text-zinc-600 truncate"
          >
            {i % labelEvery === 0 || i === data.length - 1 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────
export function DonutChart({
  segments,
  size = 168,
  thickness = 20,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  const visible = segments.filter((s) => s.value > 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={thickness}
          />
          {visible.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * c;
            const offset = c * (1 - acc);
            acc += frac;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-black text-white">{fmt(total)}</p>
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">
            Total
          </p>
        </div>
      </div>

      <div className="space-y-2 min-w-0">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-zinc-400">{s.label}</span>
            <span className="text-white font-bold ml-auto pl-3">
              {fmt(s.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
