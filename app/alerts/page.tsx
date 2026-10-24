import Link from "next/link";
import AlertCard from "@/components/AlertCard";
import Icon from "@/components/Icon";
import LegacyAlerts from "@/components/LegacyAlerts";
import { getCurrentUser } from "@/lib/authz";
import { getAlertsForUser, getPanchayat, type AreaAlert } from "@/lib/area";
import { pickName } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  // Visitors without an account (and the state admin) keep the original demo page.
  if (!user || !user.panchayat_id || !user.approved) return <LegacyAlerts />;

  const { t, lang } = getT();
  let alerts: AreaAlert[] = [];
  let failed = false;
  let place = "";
  try {
    const [list, p] = await Promise.all([getAlertsForUser(user), getPanchayat(user.panchayat_id)]);
    alerts = list;
    place = pickName(p, lang);
  } catch (err) {
    console.error("[alerts page] failed", err);
    failed = true;
  }
  const now = Date.now();

  return (
    <div className="narrow space-y-5">
      <div>
        <h1 className="page-title">{t.alerts_title}</h1>
        {place && (
          <p className="mt-1 flex items-center gap-1 text-slate-600">
            <Icon name="pin" className="h-4 w-4" />
            {place}
          </p>
        )}
      </div>

      {user.role === "panchayat_officer" && (
        <Link href="/officer/alerts" className="btn-outline">
          <Icon name="bell" />
          {t.manage_alerts}
        </Link>
      )}

      {failed ? (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      ) : alerts.length === 0 ? (
        <div className="card space-y-2 text-center text-slate-600">
          <Icon name="bell" className="mx-auto h-10 w-10 text-slate-300" />
          <p>{t.no_alerts_area}</p>
        </div>
      ) : (
        alerts.map((a) => <AlertCard key={a.id} alert={a} t={t} lang={lang} now={now} />)
      )}
    </div>
  );
}
