"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }
  return (
    <button type="button" onClick={logout} disabled={busy} className={`inline-flex items-center gap-1 ${className}`}>
      <Icon name="logout" className="h-4 w-4" />
      {t.logout}
    </button>
  );
}
