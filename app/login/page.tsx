import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";
import { getCurrentUser, ROLE_HOME } from "@/lib/authz";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  const { t } = getT();
  return (
    <div className="narrow space-y-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo className="h-16 w-16" />
        <h1 className="page-title">{t.login_title}</h1>
      </div>
      <LoginForm />
      <div className="space-y-2 text-center">
        <Link href="/register" className="btn-ghost">
          {t.new_citizen_account}
        </Link>
        <Link href="/officer/register" className="inline-block text-sm text-slate-600 underline">
          {t.officer_signup_link}
        </Link>
      </div>
    </div>
  );
}
