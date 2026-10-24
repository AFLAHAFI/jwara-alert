"use client";

import { useState, type FormEvent } from "react";
import LocationPicker from "@/components/LocationPicker";
import { useI18n } from "@/components/I18nProvider";

export default function RegisterForm({ mode }: { mode: "citizen" | "officer" }) {
  const { t } = useI18n();
  const isOfficer = mode === "officer";
  const [displayName, setDisplayName] = useState("");
  const [designation, setDesignation] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [livesAlone, setLivesAlone] = useState(false);
  const [familyPhone, setFamilyPhone] = useState("");
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
      setError(isOfficer ? t.choose_panchayat_err : t.choose_ward_err);
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
            : {
                ward_id: loc.wardId,
                birth_year: birthYear ? Number(birthYear) : undefined,
                lives_alone: livesAlone,
                family_phone: familyPhone || undefined,
              }),
        }),
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
    <form onSubmit={submit} className="card space-y-4">
      <label className="block">
        <span className="label">{t.full_name}</span>
        <input
          className="field"
          value={displayName}
          maxLength={60}
          autoComplete="name"
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </label>
      {isOfficer && (
        <label className="block">
          <span className="label">{t.designation}</span>
          <input
            className="field"
            value={designation}
            maxLength={60}
            placeholder={t.designation_hint}
            onChange={(e) => setDesignation(e.target.value)}
            required
          />
        </label>
      )}
      <LocationPicker
        level={isOfficer ? "panchayat" : "ward"}
        onChange={(v) => setLoc({ panchayatId: v.panchayatId, wardId: v.wardId })}
      />
      {!isOfficer && (
        <>
          <label className="block">
            <span className="label">{t.year_of_birth}</span>
            <input
              type="number"
              className="field"
              value={birthYear}
              min={1900}
              max={new Date().getFullYear()}
              placeholder={t.year_of_birth_hint}
              onChange={(e) => setBirthYear(e.target.value)}
            />
          </label>
          <fieldset className="space-y-1">
            <legend className="label">{t.lives_alone_q}</legend>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lives_alone"
                  checked={livesAlone}
                  onChange={() => setLivesAlone(true)}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span>{t.yes}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lives_alone"
                  checked={!livesAlone}
                  onChange={() => setLivesAlone(false)}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span>{t.no}</span>
              </label>
            </div>
          </fieldset>
          <label className="block">
            <span className="label">{t.family_phone}</span>
            <input
              type="tel"
              className="field"
              value={familyPhone}
              maxLength={10}
              placeholder={t.family_phone_hint}
              onChange={(e) => setFamilyPhone(e.target.value.replace(/\D/g, ""))}
            />
          </label>
        </>
      )}
      <label className="block">
        <span className="label">{t.username}</span>
        <input
          className="field"
          value={username}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          maxLength={30}
          aria-describedby="username-hint"
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <span id="username-hint" className="hint">
          {t.username_hint}
        </span>
      </label>
      <label className="block">
        <span className="label">{t.password}</span>
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          value={password}
          minLength={6}
          maxLength={72}
          aria-describedby="password-hint"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <span id="password-hint" className="hint">
          {t.password_hint}
        </span>
      </label>
      {error && (
        <p role="alert" className="err-box">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? t.pleaseWait : t.create_account}
      </button>
      {isOfficer && <p className="text-sm text-slate-600">{t.officer_approval_note}</p>}
    </form>
  );
}
