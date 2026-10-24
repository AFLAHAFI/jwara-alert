import Link from "next/link";
import EmergencyNumbers from "@/components/EmergencyNumbers";
import Icon, { type IconName } from "@/components/Icon";
import Logo from "@/components/Logo";
import { getCurrentUser, ROLE_HOME } from "@/lib/authz";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const { t } = getT();
  const user = await getCurrentUser();
  const steps: { icon: IconName; title: string; body: string; tone: string }[] = [
    { icon: "report", title: t.how1_t, body: t.how1_d, tone: "bg-teal-100 text-primary" },
    { icon: "alert", title: t.how2_t, body: t.how2_d, tone: "bg-red-100 text-alert" },
    { icon: "users", title: t.how3_t, body: t.how3_d, tone: "bg-amber-100 text-amber-800" },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-md md:flex md:items-center md:gap-8 md:p-10">
        <div className="mb-4 w-fit rounded-2xl bg-white p-2 md:mb-0">
          <Logo className="h-16 w-16 md:h-24 md:w-24" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold leading-tight md:text-4xl">{t.home_title}</h1>
          <p className="text-teal-50 md:text-lg">{t.home_sub}</p>
          <p className="flex items-center gap-1 text-sm text-teal-100">
            <Icon name="lock" className="h-4 w-4" />
            {t.privacy_note}
          </p>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href={user?.role === "citizen" || !user ? "/report" : ROLE_HOME[user.role]} className="btn-primary min-h-[64px] text-xl">
          <Icon name="report" className="h-6 w-6" />
          {user && user.role !== "citizen" ? t.goHome : t.cta_report}
        </Link>
        <Link href="/alerts" className="btn-outline min-h-[64px] text-xl">
          <Icon name="bell" className="h-6 w-6" />
          {t.cta_alerts}
        </Link>
      </div>

      <section aria-labelledby="how" className="space-y-3">
        <h2 id="how" className="section-title text-xl">
          {t.how_title}
        </h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card flex gap-4 md:flex-col">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${s.tone}`}>
                <Icon name={s.icon} className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold">
                  {i + 1}. {s.title}
                </p>
                <p className="text-slate-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {!user && (
        <section className="grid gap-3 md:grid-cols-2">
          <Link href="/login" className="btn-ghost">
            <Icon name="login" />
            {t.login}
          </Link>
          <Link href="/register" className="btn-ghost">
            <Icon name="user" />
            {t.new_citizen_account}
          </Link>
          <Link href="/officer/register" className="text-center text-sm text-slate-600 underline md:col-span-2">
            {t.officer_signup_link}
          </Link>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <EmergencyNumbers />
        <div className="card space-y-2 text-sm text-slate-600">
          <p>{t.install_hint}</p>
          <Link href="/dashboard" className="inline-block underline">
            {t.pin_demo_link}
          </Link>
        </div>
      </div>
    </div>
  );
}
