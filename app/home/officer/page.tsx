import Link from "next/link";
import Forbidden from "@/components/Forbidden";
import OfficerNav from "@/components/OfficerNav";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import { getDiseases, getPanchayat, getWards, getWindowReports, type Disease, type PanchayatInfo } from "@/lib/area";
import { countByWardAndDisease, RED_THRESHOLD, WINDOW_DAYS, type WardDiseaseCounts } from "@/lib/redLogic";

export const dynamic = "force-dynamic";

type Row = { wardId: number; number: number; count: number; red: boolean };
type RedHit = { wardId: number; number: number; disease: Disease; count: number };

export default async function OfficerHome({ searchParams }: { searchParams: { disease?: string } }) {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;

  let panchayat: PanchayatInfo | null = null;
  let diseases: Disease[] = [];
  let counts: WardDiseaseCounts[] = [];
  let failed = false;
  try {
    const [p, d, wards, reports] = await Promise.all([
      getPanchayat(user.panchayat_id),
      getDiseases(),
      getWards(user.panchayat_id),
      getWindowReports(user.panchayat_id),
    ]);
    panchayat = p;
    diseases = d;
    counts = countByWardAndDisease(wards, reports);
  } catch (err) {
    console.error("[home/officer] failed", err);
    failed = true;
  }

  const filterId = Number(searchParams.disease) || 0;
  const filter = diseases.find((d) => d.id === filterId) ?? null;
  const byId = new Map(diseases.map((d) => [d.id, d]));

  // Red = one disease reaching the threshold in a ward (not a mix of different illnesses).
  const redHits: RedHit[] = [];
  for (const w of counts) {
    for (const [did, n] of Array.from(w.byDisease.entries())) {
      const disease = byId.get(did);
      if (disease && n >= RED_THRESHOLD && (!filter || filter.id === did)) {
        redHits.push({ wardId: w.wardId, number: w.number, disease, count: n });
      }
    }
  }
  redHits.sort((a, b) => b.count - a.count);

  const rows: Row[] = counts.map((w) => {
    const count = filter ? w.byDisease.get(filter.id) ?? 0 : w.total;
    return { wardId: w.wardId, number: w.number, count, red: redHits.some((h) => h.wardId === w.wardId) };
  });
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(RED_THRESHOLD, ...rows.map((r) => r.count));

  // Top diseases in the panchayat for the window (for the summary chips).
  const totals = new Map<number, number>();
  for (const w of counts) for (const [did, n] of Array.from(w.byDisease.entries())) totals.set(did, (totals.get(did) ?? 0) + n);
  const top = Array.from(totals.entries())
    .filter(([did]) => byId.has(did))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-bold">
          {panchayat ? panchayat.name_ml : "പഞ്ചായത്ത്"}
          <span className="label-en">
            {panchayat ? `${panchayat.name_en}, ${panchayat.district_en}` : ""} · {user.display_name}
          </span>
        </h1>
      </section>

      <OfficerNav active="/home/officer" />

      {failed && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          ഡാറ്റ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. <span className="label-en">Could not load data. Refresh the page.</span>
        </p>
      )}

      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{total}</p>
          <p className="label-en">Reports, last {WINDOW_DAYS} days{filter ? ` (${filter.name_en})` : ""}</p>
        </div>
        <div className="card p-4 text-center">
          <p className={`text-3xl font-bold ${redHits.length ? "text-alert" : "text-primary"}`}>
            {new Set(redHits.map((h) => h.wardId)).size}
          </p>
          <p className="label-en">Red wards (≥{RED_THRESHOLD} of one illness)</p>
        </div>
      </section>

      {top.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {top.map(([did, n]) => (
            <span key={did} className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
              {byId.get(did)?.name_ml} <b>{n}</b>
            </span>
          ))}
        </div>
      )}

      {redHits.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-alert">
            ചുവപ്പ് വാർഡുകൾ <span className="label-en inline">Red wards: act now</span>
          </h2>
          {redHits.map((h) => (
            <div key={`${h.wardId}-${h.disease.id}`} className="card flex items-center justify-between gap-3 border-alert/40 p-4">
              <div>
                <p className="font-bold">
                  വാർഡ് {h.number} · {h.disease.name_ml}
                </p>
                <p className="label-en">
                  Ward {h.number}: {h.count} {h.disease.name_en} reports
                </p>
              </div>
              <Link
                href={`/officer/alerts?disease=${h.disease.id}&ward=${h.wardId}`}
                className="shrink-0 rounded-xl bg-alert px-3 py-2 text-sm font-semibold text-white"
              >
                അറിയിപ്പ് ഉണ്ടാക്കുക
                <span className="block text-xs font-normal">Create alert</span>
              </Link>
            </div>
          ))}
        </section>
      )}

      <section className="card space-y-3">
        <form className="flex items-end gap-2" action="/home/officer">
          <label className="block flex-1">
            <span className="text-sm font-semibold">
              രോഗം <span className="label-en inline">Illness filter</span>
            </span>
            <select name="disease" defaultValue={filter ? String(filter.id) : ""} className="field mt-1">
              <option value="">എല്ലാം · All illnesses</option>
              {diseases.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_ml} · {d.name_en}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="min-h-btn rounded-2xl bg-primary px-4 font-semibold text-white">
            കാണുക
          </button>
        </form>

        <div className="space-y-2" role="img" aria-label="Reports per ward">
          {rows.map((r) => {
            const pct = Math.max(r.count > 0 ? 6 : 0, Math.round((r.count / max) * 100));
            return (
              <div key={r.wardId} className="flex items-center gap-2">
                <span className={`w-20 shrink-0 text-base ${r.red ? "font-bold text-alert" : ""}`}>വാർഡ് {r.number}</span>
                <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div className={`h-full rounded-lg ${r.red ? "bg-alert" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  <span
                    aria-hidden
                    className="absolute inset-y-0"
                    style={{ left: `${(RED_THRESHOLD / max) * 100}%`, borderLeft: "2px dashed #DC2626", opacity: 0.6 }}
                  />
                </div>
                <span className={`w-6 text-right ${r.red ? "font-bold text-alert" : ""}`}>{r.count}</span>
              </div>
            );
          })}
          {rows.length === 0 && <p className="text-slate-500">No wards found.</p>}
          <p className="pt-1 text-xs text-slate-500">
            - - - ചുവപ്പ് പരിധി / red line = {RED_THRESHOLD} reports of one illness in {WINDOW_DAYS} days
          </p>
        </div>
      </section>
    </div>
  );
}
