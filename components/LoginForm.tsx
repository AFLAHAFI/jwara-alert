"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Could not log in");
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
        <span className="font-semibold">ഉപയോക്തൃനാമം <span className="label-en inline">Username</span></span>
        <input className="field mt-1" value={username} autoCapitalize="none" autoComplete="username" onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label className="block">
        <span className="font-semibold">പാസ്‌വേഡ് <span className="label-en inline">Password</span></span>
        <input className="field mt-1" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p role="alert" className="font-semibold text-red-700">{error}</p>}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "കാത്തിരിക്കുക… Please wait…" : "ലോഗിൻ · Log in"}
      </button>
    </form>
  );
}
