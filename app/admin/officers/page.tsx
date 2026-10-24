import AccountToggle from "@/components/AshaToggle";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import PendingOfficers from "@/components/PendingOfficers";
import { guardPage } from "@/lib/pageAuth";
import { getStateOverview, type StateOverview } from "@/lib/admin";
import { pickName } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminOfficers() {
  const user = await guardPage(["state_admin"]);
  if (!user) return <Forbidden />;
  const { t, lang } = getT();

  let data: StateOverview | null = null;
  try {
    data = await getStateOverview();
  } catch (err) {
    console.error("[admin/officers] failed", err);
  }
  const pById = new Map((data?.panchayats ?? []).map((p) => [p.id, p]));
  const dById = new Map((data?.districts ?? []).map((d) => [d.id, d]));
  const approved = (data?.officers ?? []).filter((o) => o.approved);

  return (
    <div className="space-y-5">
      <h1 className="page-title">{t.officers_title}</h1>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <section className="card space-y-3">
          <h2 className="section-title">
            <Icon name="clock" />
            {t.officer_approvals}
          </h2>
          <PendingOfficers />
        </section>
        <section className="card space-y-3">
          <h2 className="section-title">
            <Icon name="shield" />
            {t.officers_title}
          </h2>
          {!data && (
            <p role="alert" className="err-box">
              {t.loadError}
            </p>
          )}
          {data && approved.length === 0 && <p className="text-slate-600">{t.no_officers}</p>}
          <ul className="divide-y divide-slate-100">
            {approved.map((o) => {
              const p = o.panchayat_id ? pById.get(o.panchayat_id) : undefined;
              return (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`min-w-0 ${o.disabled ? "opacity-50" : ""}`}>
                    <p className="truncate font-semibold">
                      {o.display_name}
                      {o.disabled && <span className="chip ml-2 bg-slate-200 py-0 text-xs text-slate-600">{t.officer_off}</span>}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {o.designation} · {pickName(p, lang)}
                      {p ? `, ${pickName(dById.get(p.district_id), lang)}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">@{o.username}</p>
                  </div>
                  <AccountToggle endpoint={`/api/admin/officers/${o.id}`} disabled={o.disabled} kind="officer" />
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
