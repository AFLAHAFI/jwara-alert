"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import PasswordInput from "@/components/PasswordInput";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";
import { fmt } from "@/lib/i18n";

export default function NewAshaForm() {
  const { t } = useI18n();
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
      setMsg(fmt(t.asha_created, { name, u: username.trim().toLowerCase() }));
      setName("");
      setUsername("");
      setPassword("");
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="section-title">
        <Icon name="plus" />
        {t.new_asha}
      </h2>
      <label className="block">
        <span className="label text-sm">{t.name}</span>
        <input className="field" value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="label text-sm">{t.username}</span>
          <input
            className="field text-base"
            value={username}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="label text-sm">{t.password}</span>
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" minLength={8} className="field text-base" />
        </label>
      </div>
      <p className="hint">{t.username_hint} · {t.password_hint}</p>
      {error && (
        <p role="alert" className="err-box">
          {error}
        </p>
      )}
      {msg && (
        <p role="status" className="ok-box">
          {msg}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? t.pleaseWait : t.create}
      </button>
    </form>
  );
}
