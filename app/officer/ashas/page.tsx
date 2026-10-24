import AshaToggle from "@/components/AshaToggle";
import Forbidden from "@/components/Forbidden";
import NewAshaForm from "@/components/NewAshaForm";
import OfficerNav from "@/components/OfficerNav";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import { getAshas, getTasks, type AshaRow, type TaskRow } from "@/lib/area";

export const dynamic = "force-dynamic";

export default async function OfficerAshas() {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;

  let ashas: AshaRow[] = [];
  let tasks: TaskRow[] = [];
  let failed = false;
  try {
    [ashas, tasks] = await Promise.all([getAshas(user.panchayat_id), getTasks({ panchayatId: user.panchayat_id })]);
  } catch (err) {
    console.error("[officer/ashas] failed", err);
    failed = true;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        ആശാ പ്രവർത്തകർ <span className="label-en">ASHA workers in your panchayat</span>
      </h1>
      <OfficerNav active="/officer/ashas" />
      <NewAshaForm />
      {failed && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          Could not load ASHA workers. Refresh the page.
        </p>
      )}
      <section className="card space-y-3">
        {ashas.length === 0 && !failed && (
          <p className="text-slate-600">
            ഇതുവരെ ആരുമില്ല. <span className="label-en">No ASHA accounts yet.</span>
          </p>
        )}
        {ashas.map((a) => {
          const mine = tasks.filter((t) => t.assigned_to === a.id);
          const open = mine.filter((t) => !t.done).length;
          return (
            <div key={a.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className={a.disabled ? "opacity-50" : ""}>
                <p className="font-semibold">{a.display_name}</p>
                <p className="text-xs text-slate-500">
                  @{a.username} · {open} open / {mine.length} tasks{a.disabled ? " · OFF" : ""}
                </p>
              </div>
              <AshaToggle id={a.id} disabled={a.disabled} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
