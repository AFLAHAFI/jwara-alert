import Link from "next/link";
import Icon from "@/components/Icon";
import { getT } from "@/lib/i18n/server";

export default function Forbidden() {
  const { t } = getT();
  return (
    <div className="narrow card space-y-4 text-center">
      <Icon name="lock" className="mx-auto h-10 w-10 text-slate-400" />
      <h1 className="text-xl font-bold">{t.noAccess}</h1>
      <Link href="/home" className="btn-primary">
        {t.goHome}
      </Link>
    </div>
  );
}
