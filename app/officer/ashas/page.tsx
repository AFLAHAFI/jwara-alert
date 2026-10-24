import AccountToggle from "@/components/AshaToggle";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import NewAshaForm from "@/components/NewAshaForm";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import { getAshas, getTasks, type AshaRow, type TaskRow } from "@/lib/area";
import { fmt } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function OfficerAshas() {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;
  const { t } = getT();

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
    <div className="space-y-5">
      <h1 className="page-title">{t.ashas_title}</h1>
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <NewAshaForm />
        <section className="card space-y-3">
          {failed && (
            <p role="alert" className="err-box">
              {t.loadError}
            </p>
          )}
          {ashas.length === 0 && !failed && <p className="text-slate-600">{t.no_ashas_yet}</p>}
          <ul className="divide-y divide-slate-100">
            {ashas.map((a) => {
              const mine = tasks.filter((x) => x.assigned_to === a.id);
              const open = mine.filter((x) => !x.done).length;
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`flex min-w-0 items-center gap-3 ${a.disabled ? "opacity-50" : ""}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-primary">
                      <Icon name="user" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {a.display_name}
                        {a.disabled && <span className="chip ml-2 bg-slate-200 py-0 text-xs text-slate-600">{t.off_badge}</span>}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        @{a.username} · {fmt(t.tasks_count, { open, total: mine.length })}
                      </p>
                    </div>
                  </div>
                  <AccountToggle endpoint={`/api/officer/ashas/${a.id}`} disabled={a.disabled} />
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
