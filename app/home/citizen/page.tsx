import Link from "next/link";
import AlertCard from "@/components/AlertCard";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import ElderActions from "@/components/ElderActions";
import LargeTextToggle from "@/components/LargeTextToggle";
import { guardPage } from "@/lib/pageAuth";
import { getAlertsForUser, getPanchayat, getWardInfo, type AreaAlert, type PanchayatInfo } from "@/lib/area";
import { getActiveSosForUser, getTodayCheckinForUser, type SosRequest } from "@/lib/elder";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { WINDOW_DAYS, windowStart } from "@/lib/redLogic";
import { fmt, pickName, wardLabel } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

async function countReports(column: "ward_id" | "panchayat_id", id: number): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq(column, id)
    .gte("created_at", windowStart().toISOString());
  if (error) throw error;
  return count ?? 0;
}

export default async function CitizenHome() {
  const user = await guardPage(["citizen"]);
  if (!user) return <Forbidden />;
  const { t, lang } = getT();

  let latest: AreaAlert | null = null;
  let wardCount: number | null = null;
  let panchayatCount: number | null = null;
  let place = "";
  let failed = false;
  let activeSos: SosRequest | null = null;
  let todayCheckin = { checked_in: false, checkin_at: null as string | null };

  try {
    const promises: Promise<unknown>[] = [
      getAlertsForUser(user, 1),
      user.panchayat_id ? getPanchayat(user.panchayat_id) : Promise.resolve(null),
      getWardInfo(user.ward_id),
      user.ward_id ? countReports("ward_id", user.ward_id) : Promise.resolve(0),
      user.panchayat_id ? countReports("panchayat_id", user.panchayat_id) : Promise.resolve(0),
    ];

    if (user.is_elder) {
      promises.push(getActiveSosForUser(user.id));
      promises.push(getTodayCheckinForUser(user.id));
    }

    const results = await Promise.all(promises);
    const alerts = results[0] as AreaAlert[];
    const p = results[1] as PanchayatInfo | null;
    const ward = results[2] as { number: number; name: string | null } | null;
    wardCount = results[3] as number;
    panchayatCount = results[4] as number;
    if (user.is_elder) {
      activeSos = results[5] as SosRequest | null;
      todayCheckin = results[6] as { checked_in: boolean; checkin_at: string | null };
    }

    latest = alerts[0] ?? null;
    if (p) place = `${wardLabel(t, ward?.number, ward?.name)}, ${pickName(p, lang)}, ${pickName(p.district, lang)}`;
  } catch (err) {
    console.error("[home/citizen] failed", err);
    failed = true;
  }

  // -------------------------------------------------------------
  // Elder Home Screen
  // -------------------------------------------------------------
  if (user.is_elder) {
    return (
      <div className="narrow space-y-6">
        <section className="card flex flex-wrap items-center justify-between gap-3 p-5 shadow-md">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 text-2xl font-black">{fmt(t.hello, { name: user.display_name })}</h1>
              <span className="chip shrink-0 bg-amber-100 text-amber-900 font-bold">{t.elder_badge}</span>
            </div>
            {place && (
              <p className="mt-1 flex items-center gap-1 text-slate-600 font-semibold">
                <Icon name="pin" className="h-4 w-4 shrink-0" />
                {place}
              </p>
            )}
          </div>
          <LargeTextToggle initialLarge={user.large_text} />
        </section>

        {/* 1. Big Call Buttons */}
        <section className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="tel:108"
              className="flex items-center justify-center gap-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-2xl py-5 px-4 shadow-lg border-2 border-red-800 transition-transform"
            >
              <Icon name="phone" className="h-7 w-7 shrink-0" />
              <span>{t.call_108}</span>
            </a>
            <a
              href="tel:112"
              className="flex items-center justify-center gap-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-2xl py-5 px-4 shadow-lg border-2 border-blue-800 transition-transform"
            >
              <Icon name="phone" className="h-7 w-7 shrink-0" />
              <span>{t.call_112}</span>
            </a>
          </div>
          <p className="text-center font-bold text-slate-700 text-sm md:text-base bg-amber-50 border border-amber-200 rounded-xl p-3 leading-snug">
            {t.emergency_ambulance_note}
          </p>
        </section>

        {/* 2 & 3. Big SOS & "I am OK" check-in buttons */}
        <ElderActions initialSos={activeSos} initialCheckin={todayCheckin} />

        {/* 4. Latest alert card and Report button */}
        {latest && (
          <section className="space-y-2">
            <h2 className="section-title text-xl font-bold">
              <Icon name="bell" className="h-6 w-6 text-alert" />
              {t.latest_alert}
            </h2>
            <AlertCard alert={latest} t={t} lang={lang} compact now={Date.now()} />
            <Link
              href="/alerts"
              className="flex items-center justify-center gap-1 font-bold text-primary underline py-1"
            >
              {t.all_alerts}
              <Icon name="chevron" className="h-4 w-4" />
            </Link>
          </section>
        )}

        <Link
          href="/report"
          className="btn-primary min-h-[64px] text-xl font-black flex items-center justify-center gap-3 shadow-md"
        >
          <Icon name="report" className="h-7 w-7" />
          {t.cta_report}
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Standard Resident Home Screen
  // -------------------------------------------------------------
  return (
    <div className="narrow space-y-5">
      <section className="card flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{fmt(t.hello, { name: user.display_name })}</h1>
          {place && (
            <p className="mt-1 flex items-center gap-1 text-slate-600">
              <Icon name="pin" className="h-4 w-4 shrink-0" />
              {place}
            </p>
          )}
        </div>
        <LargeTextToggle initialLarge={user.large_text} />
      </section>

      <Link href="/report" className="btn-primary min-h-[60px] md:text-xl">
        <Icon name="report" className="h-6 w-6" />
        {t.cta_report}
      </Link>

      {failed ? (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      ) : latest ? (
        <section className="space-y-2">
          <h2 className="section-title">
            <Icon name="bell" className="h-5 w-5 text-alert" />
            {t.latest_alert}
          </h2>
          <AlertCard alert={latest} t={t} lang={lang} compact now={Date.now()} />
          <Link href="/alerts" className="flex items-center justify-center gap-1 text-sm font-semibold text-primary underline">
            {t.all_alerts}
            <Icon name="chevron" className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <p className="card flex items-center gap-3 text-slate-600">
          <Icon name="check" className="h-6 w-6 shrink-0 text-primary" />
          {t.no_alerts_now}
        </p>
      )}

      {!failed && (
        <section className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-primary">{wardCount ?? "–"}</p>
              <p className="text-sm text-slate-600">{t.my_ward}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-primary">{panchayatCount ?? "–"}</p>
              <p className="text-sm text-slate-600">{t.panchayat_total}</p>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500">{fmt(t.counts_note, { n: WINDOW_DAYS })}</p>
        </section>
      )}
    </div>
  );
}
