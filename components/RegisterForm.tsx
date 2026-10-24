"use client";

import { useState, type FormEvent } from "react";
import LocationPicker from "@/components/LocationPicker";

export default function RegisterForm({ mode }: { mode: "citizen" | "officer" }) {
  const isOfficer = mode === "officer";
  const [displayName, setDisplayName] = useState("");
  const [designation, setDesignation] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loc, setLoc] = useState<{ panchayatId: number | null; wardId: number | null }>({
    panchayatId: null,
    wardId: null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (isOfficer ? !loc.panchayatId : !loc.wardId) {
      setError(isOfficer ? "പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക · Choose your panchayat" : "വാർഡ് തിരഞ്ഞെടുക്കുക · Choose your ward");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(isOfficer ? "/api/auth/register-officer" : "/api/auth/register-citizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          username,
          password,
          ...(isOfficer
            ? { designation, panchayat_id: loc.panchayatId }
            : { ward_id: loc.wardId }),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Something went wrong");
        setBusy(false);
        return;
      }
      window.location.href = "/home";
    } catch {
      setError("Network problem. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <label className="block">
        <span className="font-semibold">പേര് <span className="label-en inline">Full name</span></span>
        <input className="field mt-1" value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} required />
      </label>
      {isOfficer && (
        <label className="block">
          <span className="font-semibold">പദവി <span className="label-en inline">Designation (e.g. Health Inspector)</span></span>
          <input className="field mt-1" value={designation} maxLength={60} onChange={(e) => setDesignation(e.target.value)} required />
        </label>
      )}
      <LocationPicker
        level={isOfficer ? "panchayat" : "ward"}
        onChange={(v) => setLoc({ panchayatId: v.panchayatId, wardId: v.wardId })}
      />
      <label className="block">
        <span className="font-semibold">ഉപയോക്തൃനാമം <span className="label-en inline">Username</span></span>
        <input
          className="field mt-1"
          value={username}
          autoCapitalize="none"
          autoComplete="username"
          maxLength={30}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="font-semibold">പാസ്‌വേഡ് <span className="label-en inline">Password (6+ characters)</span></span>
        <input
          className="field mt-1"
          type="password"
          autoComplete="new-password"
          value={password}
          maxLength={72}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p role="alert" className="font-semibold text-red-700">{error}</p>}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "കാത്തിരിക്കുക… Please wait…" : "അക്കൗണ്ട് ഉണ്ടാക്കുക · Create account"}
      </button>
      {isOfficer && (
        <p className="text-sm text-slate-600">
          സംസ്ഥാന ആരോഗ്യ വകുപ്പ് അംഗീകരിച്ച ശേഷമേ പ്രവേശനം ലഭിക്കൂ.
          <span className="label-en">Access starts after the state health department approves you.</span>
        </p>
      )}
    </form>
  );
}
