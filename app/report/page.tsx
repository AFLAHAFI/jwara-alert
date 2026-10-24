import Link from "next/link";
import EmergencyNumbers from "@/components/EmergencyNumbers";
import ReportForm from "@/components/ReportForm";
import { getCurrentUser } from "@/lib/authz";
import { getDiseases, getPanchayat, getWardInfo } from "@/lib/area";
import { pickName, wardLabel } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const { t, lang } = getT();
  const user = await getCurrentUser();
  let citizen: Parameters<typeof ReportForm>[0]["citizen"];
  if (user?.role === "citizen" && user.ward_id && user.panchayat_id) {
    try {
      const [diseases, panchayat, ward] = await Promise.all([
        getDiseases({ citizenOnly: true }),
        getPanchayat(user.panchayat_id),
        getWardInfo(user.ward_id),
      ]);
      citizen = {
        diseases: diseases.map((d) => ({ id: d.id, slug: d.slug, name: pickName(d, lang) })),
        place: `${wardLabel(t, ward?.number, ward?.name)}, ${pickName(panchayat, lang)}`,
      };
    } catch (err) {
      console.error("[report page] citizen info failed", err);
    }
  }

  return (
    <div className="narrow space-y-5">
      <h1 className="page-title">{citizen ? t.report_title : t.report_title_anon}</h1>
      <ReportForm citizen={citizen} />
      {!user && (
        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="underline">
            {t.login_to_pick_illness}
          </Link>
        </p>
      )}
      <EmergencyNumbers />
    </div>
  );
}
