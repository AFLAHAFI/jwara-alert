"use client";

import { useState } from "react";

export default function LogoutButton({ className = "" }: { className?: string }) {
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
    <button type="button" onClick={logout} disabled={busy} className={className}>
      ലോഗൗട്ട് · Logout
    </button>
  );
}
