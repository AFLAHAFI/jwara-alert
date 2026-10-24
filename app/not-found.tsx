import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default function NotFound() {
  const { t } = getT();
  return (
    <div className="narrow card space-y-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <p>{t.err_not_found}</p>
      <Link href="/" className="btn-primary">
        {t.goHome}
      </Link>
    </div>
  );
}
