"use client";

import { useState } from "react";
import { useApi } from "@/components/useApi";

export default function NewAshaForm() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const { busy, error, call } = useApi();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const ok = await call("/api/officer/ashas", "POST", { display_name: name, username, password });
    if (ok) {
      setMsg(`Account created. Give ${name} the username "${username.trim().toLowerCase()}" and the password.`);
      setName("");
      setUsername("");
      setPassword("");
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="text-lg font-bold">
        പുതിയ ആശാ അക്കൗണ്ട് <span className="label-en inline">New ASHA account</span>
      </h2>
      <label className="block">
        <span className="text-sm font-semibold">പേര് · Name</span>
        <input className="field mt-1" value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-semibold">Username</span>
          <input
            className="field mt-1 text-base"
            value={username}
            maxLength={30}
            autoCapitalize="none"
            required
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input
            className="field mt-1 text-base"
            type="password"
            autoComplete="new-password"
            value={password}
            maxLength={72}
            minLength={6}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-2 text-alert">{error}</p>}
      {msg && <p className="rounded-xl bg-teal-50 p-2 text-primary">{msg}</p>}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "…" : "ഉണ്ടാക്കുക · Create"}
      </button>
    </form>
  );
}
