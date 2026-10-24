import Link from "next/link";
import AlertCard from "@/components/AlertCard";
import LegacyAlerts from "@/components/LegacyAlerts";
import { getCurrentUser } from "@/lib/authz";
import { getAlertsForUser, getPanchayat, type AreaAlert } from "@/lib/area";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  // Visitors without an account (and the state admin) keep the original demo page.
  if (!user || !user.panchayat_id || !user.approved) return <LegacyAlerts />;

  let alerts: AreaAlert[] = [];
  let failed = false;
  let place = "";
  try {
    const [list, p] = await Promise.all([getAlertsForUser(user), getPanchayat(user.panchayat_id)]);
    alerts = list;
    place = p ? `${p.name_ml} · ${p.name_en}` : "";
  } catch (err) {
    console.error("[alerts page] failed", err);
    failed = true;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        നിങ്ങളുടെ പ്രദേശത്തെ അറിയിപ്പുകൾ
        <span className="label-en">Alerts for your area · {place}</span>
      </h1>

      {user.role === "panchayat_officer" && (
        <Link href="/officer/alerts" className="btn-outline">
          അറിയിപ്പുകൾ കൈകാര്യം ചെയ്യുക · Manage alerts
        </Link>
      )}

      {failed ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          അറിയിപ്പുകൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.
          <span className="label-en">Could not load alerts. Pull down to refresh.</span>
        </p>
      ) : alerts.length === 0 ? (
        <p className="card text-center text-slate-600">
          നിങ്ങളുടെ പ്രദേശത്ത് അറിയിപ്പുകൾ ഒന്നുമില്ല.
          <span className="label-en">No alerts in your area.</span>
        </p>
      ) : (
        alerts.map((a) => <AlertCard key={a.id} alert={a} />)
      )}

      <p className="text-center text-sm text-slate-500">മാതൃകാ ഡാറ്റ · Example data only</p>
    </div>
  );
}
