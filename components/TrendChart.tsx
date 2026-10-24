import type { Trend } from "@/lib/area";
import { formatDay, pickName, type Dict, type Lang } from "@/lib/i18n";

// Categorical slots 1-3 (validated palette: blue, orange, aqua), fixed order, never cycled.
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"];

export default function TrendChart({ trend, t, lang }: { trend: Trend; t: Dict; lang: Lang }) {
  const W = 340;
  const H = 170;
  const L = 26;
  const R = 10;
  const T = 10;
  const B = 24;
  const max = Math.max(4, ...trend.series.flatMap((s) => s.counts));
  const yMax = Math.ceil(max / 2) * 2;
  const x = (i: number) => L + (i * (W - L - R)) / 6;
  const y = (v: number) => T + (H - T - B) * (1 - v / yMax);
  const ticks = [0, yMax / 2, yMax];

  if (trend.series.length === 0) return <p className="text-slate-600">{t.no_reports}</p>;

  return (
    <figure className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.trend_title}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize={9} fill="#64748b">
              {v}
            </text>
          </g>
        ))}
        {trend.days.map((d, i) => (
          <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="#64748b">
            {i % 2 === 0 || i === 6 ? formatDay(d, lang) : ""}
          </text>
        ))}
        {trend.series.map((s, si) => (
          <g key={s.disease.id}>
            <polyline
              points={s.counts.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={SERIES[si]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.counts.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={4} fill={SERIES[si]} stroke="#fff" strokeWidth={2}>
                <title>{`${pickName(s.disease, lang)} · ${formatDay(trend.days[i], lang)}: ${v}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <ul className="space-y-1 text-sm">
        {trend.series.map((s, si) => {
          const dir = s.last3 > s.prev3 ? "up" : s.last3 < s.prev3 ? "down" : "same";
          return (
            <li key={s.disease.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-block h-2.5 w-4 shrink-0 rounded-full" style={{ background: SERIES[si] }} aria-hidden />
                <span className="truncate">{pickName(s.disease, lang)}</span>
                <span className="tabular-nums text-slate-500">{s.counts.reduce((a, b) => a + b, 0)}</span>
              </span>
              <span
                className={`chip shrink-0 py-0.5 text-xs ${
                  dir === "up" ? "bg-red-50 text-alert" : dir === "down" ? "bg-teal-50 text-primary-dark" : "bg-slate-100 text-slate-600"
                }`}
              >
                {dir === "up" ? "▲ " + t.trend_rising : dir === "down" ? "▼ " + t.trend_falling : "● " + t.trend_steady}
              </span>
            </li>
          );
        })}
      </ul>
      <figcaption className="text-xs text-slate-500">{t.trend_note}</figcaption>
    </figure>
  );
}
