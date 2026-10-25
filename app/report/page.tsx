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
  let citizen: { place: string } | undefined;
  let diseases: { id: number; slug: string; name: string }[] = [];
  let failed = false;
  try {
    const list = await getDiseases({ citizenOnly: true });
    diseases = list.map((d) => ({ id: d.id, slug: d.slug, name: pickName(d, lang) }));
    if (user?.role === "citizen" && user.ward_id && user.panchayat_id) {
      const [panchayat, ward] = await Promise.all([getPanchayat(user.panchayat_id), getWardInfo(user.ward_id)]);
      citizen = { place: `${wardLabel(t, ward?.number, ward?.name)}, ${pickName(panchayat, lang)}` };
    }
  } catch (err) {
    console.error("[report page] load failed", err);
    failed = true;
  }

  return (
    <div className="narrow space-y-5">
      <h1 className="page-title">{t.report_title}</h1>
      {failed || diseases.length === 0 ? (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      ) : (
        <ReportForm citizen={citizen} diseases={diseases} />
      )}
      {!user && (
        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="underline">
            {t.report_login_hint}
          </Link>
        </p>
      )}
      <EmergencyNumbers />
    </div>
  );
}
