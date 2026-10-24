import Link from "next/link";
import type { AreaStats, DistrictRow } from "@/lib/admin";
import { pickName, type Dict, type Lang } from "@/lib/i18n";

/**
 * Schematic tile map of Kerala's 14 districts, north to south along the coast
 * (not to scale). Each tile links to the district page.
 */
const LAYOUT: Record<string, { x: number; y: number; code: string }> = {
  Kasaragod: { x: 0.0, y: 0.0, code: "KSD" },
  Kannur: { x: 0.3, y: 1.0, code: "KNR" },
  Wayanad: { x: 1.5, y: 1.0, code: "WYD" },
  Kozhikode: { x: 0.6, y: 2.0, code: "KKD" },
  Malappuram: { x: 1.0, y: 3.0, code: "MLP" },
  Palakkad: { x: 2.2, y: 3.0, code: "PKD" },
  Thrissur: { x: 1.4, y: 4.0, code: "TSR" },
  Idukki: { x: 3.0, y: 4.8, code: "IDK" },
  Ernakulam: { x: 1.8, y: 5.0, code: "EKM" },
  Kottayam: { x: 2.3, y: 6.0, code: "KTM" },
  Alappuzha: { x: 1.2, y: 6.3, code: "ALP" },
  Pathanamthitta: { x: 2.6, y: 7.1, code: "PTA" },
  Kollam: { x: 1.9, y: 8.1, code: "KLM" },
  Thiruvananthapuram: { x: 2.4, y: 9.2, code: "TVM" },
};
const U = 58; // px per layout unit
const TW = 54;
const TH = 50;

type Level = "red" | "watch" | "low" | "none";
const FILL: Record<Level, { bg: string; fg: string; stroke: string }> = {
  red: { bg: "#DC2626", fg: "#ffffff", stroke: "#991b1b" },
  watch: { bg: "#fcd34d", fg: "#451a03", stroke: "#d97706" },
  low: { bg: "#a7f3d0", fg: "#064e3b", stroke: "#34d399" },
  none: { bg: "#f1f5f9", fg: "#475569", stroke: "#cbd5e1" },
};

function level(s: AreaStats | undefined): Level {
  if (!s) return "none";
  if (s.redWards > 0) return "red";
  if (s.reports >= 5) return "watch";
  if (s.reports > 0) return "low";
  return "none";
}

export default function KeralaMap({
  districts,
  stats,
  t,
  lang,
}: {
  districts: DistrictRow[];
  stats: Map<number, AreaStats>;
  t: Dict;
  lang: Lang;
}) {
  const W = 4.1 * U;
  const H = 10.2 * U;
  const legend: { l: Level; text: string }[] = [
    { l: "red", text: t.map_red },
    { l: "watch", text: t.map_watch },
    { l: "low", text: t.map_low },
    { l: "none", text: t.map_none },
  ];
  return (
    <figure className="space-y-3">
      <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} className="mx-auto w-full max-w-[240px] sm:max-w-[280px]" role="img" aria-label={t.kerala_map}>
        {districts.map((d) => {
          const pos = LAYOUT[d.name_en];
          if (!pos) return null;
          const s = stats.get(d.id);
          const lv = level(s);
          const f = FILL[lv];
          const name = pickName(d, lang);
          const label = `${name}: ${s?.reports ?? 0} · ${t.col_red} ${s?.redWards ?? 0}`;
          return (
            <Link key={d.id} href={`/admin/district/${d.id}`} aria-label={label}>
              <g className="cursor-pointer transition hover:opacity-80">
                <title>{label}</title>
                <rect x={pos.x * U} y={pos.y * U} width={TW} height={TH} rx={10} fill={f.bg} stroke={f.stroke} strokeWidth={2} />
                <text x={pos.x * U + TW / 2} y={pos.y * U + 21} textAnchor="middle" fontSize={13} fontWeight={700} fill={f.fg}>
                  {pos.code}
                </text>
                <text x={pos.x * U + TW / 2} y={pos.y * U + 38} textAnchor="middle" fontSize={11} fill={f.fg}>
                  {s?.reports ?? 0}
                  {s?.redWards ? ` · ${s.redWards}●` : ""}
                </text>
              </g>
            </Link>
          );
        })}
      </svg>
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-600">
        {legend.map((x) => (
          <li key={x.l} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded border" style={{ background: FILL[x.l].bg, borderColor: FILL[x.l].stroke }} aria-hidden />
            {x.text}
          </li>
        ))}
      </ul>
      <figcaption className="text-center text-xs text-slate-500">{t.map_note}</figcaption>
    </figure>
  );
}
