import Link from "next/link";
import FacilityForm from "@/components/FacilityForm";
import FacilityRemove from "@/components/FacilityRemove";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import { getT } from "@/lib/i18n/server";
import { getFacilities, type Facility } from "@/lib/wardStatus";

export const dynamic = "force-dynamic";

export default async function OfficerFacilities() {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;
  const { t } = getT();

  let list: Facility[] = [];
  let failed = false;
  try {
    list = await getFacilities(user.panchayat_id);
  } catch (err) {
    console.error("[officer/facilities] failed", err);
    failed = true;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t.fac_title}</h1>
        <p className="mt-1 text-slate-600">{t.fac_officer_sub}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <FacilityForm />
        <section className="card space-y-3">
          {failed && (
            <p role="alert" className="err-box">
              {t.loadError}
            </p>
          )}
          {!failed && list.length === 0 && <p className="text-slate-600">{t.fac_none_officer}</p>}
          <ul className="divide-y divide-slate-100">
            {list.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-bold">{f.name}</p>
                  <p className="text-sm text-slate-600">
                    {t[`fac_kind_${f.kind}`]}
                    {f.open_24h && ` · ${t.fac_24h}`}
                    {f.phone && ` · ${f.phone}`}
                  </p>
                  {f.address && <p className="text-sm text-slate-500">{f.address}</p>}
                </div>
                <FacilityRemove id={f.id} />
              </li>
            ))}
          </ul>
          <Link href="/ward" className="btn-ghost w-full">
            <Icon name="shield" />
            {t.fac_see_public}
          </Link>
        </section>
      </div>
    </div>
  );
}
