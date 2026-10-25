"use client";

import { useState, type FormEvent } from "react";
import PasswordInput from "@/components/PasswordInput";
import { useI18n } from "@/components/I18nProvider";

export default function LoginForm() {
  const { t } = useI18n();
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
        setError(j.error ?? t.genericError);
        setBusy(false);
        return;
      }
      window.location.href = "/home";
    } catch {
      setError(t.networkError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4" noValidate>
      <label className="block">
        <span className="label">{t.username}</span>
        <input
          className="field"
          value={username}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="label">{t.password}</span>
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
      </label>
      {error && (
        <p role="alert" className="err-box">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={busy || !username || !password}>
        {busy ? t.pleaseWait : t.login_btn}
      </button>
    </form>
  );
}
