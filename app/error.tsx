"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="narrow card space-y-4 text-center">
      <p className="err-box">{t.genericError}</p>
      <button type="button" className="btn-primary" onClick={reset}>
        {t.retry}
      </button>
    </div>
  );
}
