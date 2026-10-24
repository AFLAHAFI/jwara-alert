import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import { getT } from "@/lib/i18n/server";

export default function OfficerRegisterPage() {
  const { t } = getT();
  return (
    <div className="narrow space-y-4">
      <h1 className="page-title">{t.reg_officer_title}</h1>
      <RegisterForm mode="officer" />
      <p className="text-center text-sm">
        <Link href="/login" className="underline">
          {t.have_account}
        </Link>
      </p>
    </div>
  );
}
