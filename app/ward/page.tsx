import type { Metadata } from "next";
import Link from "next/link";
import AlertCard from "@/components/AlertCard";
import FacilityList from "@/components/FacilityList";
import Icon from "@/components/Icon";
import ShareWhatsApp from "@/components/ShareWhatsApp";
import WardPicker from "@/components/WardPicker";
import { getCurrentUser } from "@/lib/authz";
import { fmt, pickName, wardLabel, type Dict, type DictKey } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { WINDOW_DAYS } from "@/lib/redLogic";
import { SITE_URL } from "@/lib/site";
import { getFacilities, getWardStatus, type Facility, type Level, type WardStatus } from "@/lib/wardStatus";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: `${t.ws_title} · ${t.appName}` };
}

/** Tips for each illness group. Unknown slugs fall back to the general tips. */
const TIP_GROUP: Record<string, DictKey> = {
  dengue: "tip_mosquito",
  chikungunya: "tip_mosquito",
  malaria: "tip_mosquito",
  leptospirosis: "tip_lepto",
  "hepatitis-a": "tip_water",
  typhoid: "tip_water",
  diarrhoea: "tip_water",
  cholera: "tip_water",
  h1n1: "tip_air",
  respiratory: "tip_air",
  chickenpox: "tip_air",
  measles: "tip_air",
  mumps: "tip_air",
  "scrub-typhus": "tip_scrub",
  nipah: "tip_nipah",
};
const GENERAL_TIPS: DictKey[] = ["tip_g1", "tip_g2", "tip_g3", "tip_g4"];

const LEVEL_UI: Record<Level, { box: string; dot: string; title: DictKey; body: DictKey }> = {
  safe: { box: "border-green-300 bg-green-50 text-green-900", dot: "bg-green-500", title: "ws_safe", body: "ws_safe_d" },
  watch: { box: "border-amber-300 bg-amber-50 text-amber-900", dot: "bg-amber-500", title: "ws_watch", body: "ws_watch_d" },
  red: { box: "border-red-300 bg-red-50 text-red-900", dot: "bg-red-600", title: "ws_red", body: "ws_red_d" },
};

function parseWard(v: string | string[] | undefined): number | null {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s || !/^\d{1,9}$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
}

function tipsFor(status: WardStatus | null): DictKey[] {
  const keys = new Set<DictKey>();
  for (const d of status?.diseases ?? []) {
    const k = TIP_GROUP[d.slug];
    if (k) keys.add(k);
  }
  return keys.size ? [...Array.from(keys), "tip_g4"] : GENERAL_TIPS;
}

export default async function WardStatusPage({ searchParams }: { searchParams: { w?: string | string[] } }) {
  const { t, lang } = getT();
  let wardId = parseWard(searchParams.w);
  // A logged-in resident sees their own ward first.
  if (!wardId && searchParams.w === undefined) {
    const user = await getCurrentUser();
    if (user?.role === "citizen" && user.ward_id) wardId = user.ward_id;
  }

  let status: WardStatus | null = null;
  let facilities: Facility[] = [];
  let failed = false;
  let facFailed = false;
  if (wardId) {
    try {
      status = await getWardStatus(wardId);
    } catch (err) {
      console.error("[ward page] status failed", err);
      failed = true;
    }
    if (status) {
      try {
        facilities = await getFacilities(status.place.panchayatId);
      } catch (err) {
        console.error("[ward page] facilities failed", err);
        facFailed = true;
      }
    }
  }
  const notFound = !!wardId && !failed && !status;
  const now = Date.now();

  return (
    <div className="narrow space-y-5">
      <div>
        <h1 className="page-title">{t.ws_title}</h1>
        <p className="mt-1 text-slate-600">{t.ws_sub}</p>
      </div>

      {failed && (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      )}
      {notFound && (
        <p role="alert" className="err-box">
          {t.ws_not_found}
        </p>
      )}

      {status && <StatusCard t={t} status={status} lang={lang} />}

      {status && (
        <section className="card space-y-2" aria-labelledby="tips-title">
          <h2 id="tips-title" className="section-title">
            <Icon name="check" />
            {t.ws_tips}
          </h2>
          <ul className="space-y-2">
            {tipsFor(status).map((k) => (
              <li key={k} className="flex gap-2">
                <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span>{t[k]}</span>
              </li>
            ))}
          </ul>
          <p className="hint">{t.ws_fever_hint}</p>
        </section>
      )}

      {status && status.alerts.length > 0 && (
        <section className="space-y-3" aria-labelledby="ws-alerts">
          <h2 id="ws-alerts" className="section-title">
            <Icon name="bell" />
            {t.ws_alerts}
          </h2>
          {status.alerts.map((a) => (
            <AlertCard key={a.id} alert={a} t={t} lang={lang} now={now} />
          ))}
        </section>
      )}

      {status && (
        <FacilityList
          t={t}
          facilities={facilities}
          failed={facFailed}
          placeName={status.place.panchayat.name_en}
          districtName={status.place.district?.name_en ?? ""}
        />
      )}

      {status && (
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/report" className="btn-primary">
            <Icon name="report" />
            {t.cta_report}
          </Link>
          <ShareWhatsApp text={fmt(t.ws_share, { ward: wardLabel(t, status.place.number, status.place.name), place: pickName(status.place.panchayat, lang), level: t[LEVEL_UI[status.level].title] })} url={`${SITE_URL}/ward?w=${status.place.wardId}`} t={t} />
        </div>
      )}

      <WardPicker />
      <p className="hint text-center">{fmt(t.ws_rule, { days: WINDOW_DAYS })}</p>
    </div>
  );
}

function StatusCard({ t, status, lang }: { t: Dict; status: WardStatus; lang: Parameters<typeof pickName>[1] }) {
  const ui = LEVEL_UI[status.level];
  const p = status.place;
  return (
    <section className={`rounded-3xl border-2 p-5 ${ui.box}`} aria-live="polite">
      <p className="flex items-center gap-1 text-sm opacity-80">
        <Icon name="pin" className="h-4 w-4" />
        {wardLabel(t, p.number, p.name)} · {pickName(p.panchayat, lang)}
        {p.district && ` · ${pickName(p.district, lang)}`}
      </p>
      <p className="mt-2 flex items-center gap-3 text-2xl font-bold">
        <span className={`h-5 w-5 shrink-0 rounded-full ${ui.dot}`} aria-hidden />
        {t[ui.title]}
      </p>
      <p className="mt-1">{t[ui.body]}</p>
      {status.diseases.length > 0 && (
        <p className="mt-2 font-semibold">
          {t.ws_seen}: {status.diseases.map((d) => pickName(d, lang)).join(", ")}
        </p>
      )}
    </section>
  );
}
