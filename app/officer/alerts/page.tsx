import AlertCard, { targetLabel } from "@/components/AlertCard";
import AssignTaskForm from "@/components/AssignTaskForm";
import DraftAlert from "@/components/DraftAlert";
import Forbidden from "@/components/Forbidden";
import NewAlertForm from "@/components/NewAlertForm";
import OfficerNav from "@/components/OfficerNav";
import TaskBadge from "@/components/TaskBadge";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import {
  getAshas,
  getDiseases,
  getPanchayat,
  getPanchayatAlerts,
  getTasks,
  getWards,
  type AreaAlert,
  type AshaRow,
  type Disease,
  type TaskRow,
  type WardRow,
} from "@/lib/area";

export const dynamic = "force-dynamic";

export default async function OfficerAlerts({
  searchParams,
}: {
  searchParams: { disease?: string; ward?: string };
}) {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;

  let diseases: Disease[] = [];
  let wards: WardRow[] = [];
  let alerts: AreaAlert[] = [];
  let ashas: AshaRow[] = [];
  let tasks: TaskRow[] = [];
  let panchayatMl = "";
  let failed = false;
  try {
    const [d, w, a, s, t, p] = await Promise.all([
      getDiseases(),
      getWards(user.panchayat_id),
      getPanchayatAlerts(user.panchayat_id),
      getAshas(user.panchayat_id),
      getTasks({ panchayatId: user.panchayat_id }),
      getPanchayat(user.panchayat_id),
    ]);
    diseases = d;
    wards = w;
    alerts = a;
    ashas = s.filter((x) => !x.disabled);
    tasks = t;
    panchayatMl = p?.name_ml ?? "";
  } catch (err) {
    console.error("[officer/alerts] failed", err);
    failed = true;
  }

  const drafts = alerts.filter((a) => a.status === "draft");
  const published = alerts.filter((a) => a.status === "published");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        അറിയിപ്പുകൾ <span className="label-en">Alerts and ASHA follow-up</span>
      </h1>
      <OfficerNav active="/officer/alerts" />

      {failed ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          ഡാറ്റ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. <span className="label-en">Could not load data. Refresh the page.</span>
        </p>
      ) : (
        <NewAlertForm
          key={`${searchParams.disease ?? ""}-${searchParams.ward ?? ""}`}
          diseases={diseases}
          wards={wards}
          panchayatMl={panchayatMl}
          initialDiseaseId={Number(searchParams.disease) || undefined}
          initialWardId={Number(searchParams.ward) || undefined}
        />
      )}

      {drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-amber-800">
            കരടുകൾ ({drafts.length}) <span className="label-en">Drafts: only you can see these</span>
          </h2>
          {drafts.map((a) => {
            const t = targetLabel(a);
            return (
              <DraftAlert
                key={a.id}
                id={a.id}
                body={a.body_ml}
                title={a.disease ? `${a.disease.name_ml} · ${a.disease.name_en}` : "Alert"}
                target={`${t.ml} · ${t.en}`}
              />
            );
          })}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">
          പ്രസിദ്ധീകരിച്ചവ <span className="label-en inline">Published</span>
        </h2>
        {published.length === 0 && (
          <p className="card text-center text-slate-600">
            ഇതുവരെ ഒന്നുമില്ല. <span className="label-en">Nothing published yet.</span>
          </p>
        )}
        {published.map((a) => {
          const alertTasks = tasks.filter((t) => t.alert_id === a.id);
          const taskWards = a.target === "wards" && a.wards.length ? a.wards : wards;
          return (
            <div key={a.id} className="space-y-2">
              <AlertCard alert={a} compact />
              <div className="card space-y-2 p-4">
                <p className="text-sm font-semibold">
                  ആശാ സന്ദർശനങ്ങൾ <span className="label-en inline">ASHA visits ({alertTasks.length})</span>
                </p>
                {alertTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      വാർഡ് {t.ward_number} · {t.asha_name}
                    </span>
                    <TaskBadge task={t} />
                  </div>
                ))}
                <AssignTaskForm alertId={a.id} diseaseEn={a.disease?.name_en ?? "follow-up"} wards={taskWards} ashas={ashas} />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
