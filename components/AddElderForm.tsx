"use client";

import { useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";
import { wardLabel } from "@/lib/i18n";

export default function AddElderForm({
  wards,
}: {
  wards: { id: number; number: number; name?: string | null }[];
}) {
  const { t } = useI18n();
  const { busy, error, call, setError } = useApi();
  const [open, setOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [wardId, setWardId] = useState<number | "">(wards[0]?.id ?? "");
  const [birthYear, setBirthYear] = useState("");
  const [livesAlone, setLivesAlone] = useState(false);
  const [familyPhone, setFamilyPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    if (!wardId) {
      setError(t.choose_ward_err);
      return;
    }
    const ok = await call("/api/asha/elders", "POST", {
      display_name: displayName,
      ward_id: Number(wardId),
      birth_year: birthYear ? Number(birthYear) : undefined,
      lives_alone: livesAlone,
      family_phone: familyPhone || undefined,
      username,
      password,
    });
    if (ok) {
      setSuccess(true);
      setDisplayName("");
      setBirthYear("");
      setLivesAlone(false);
      setFamilyPhone("");
      setUsername("");
      setPassword("");
    }
  }

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title text-xl font-bold flex items-center gap-2">
            <Icon name="user" className="h-5 w-5 text-primary" />
            {t.add_elder}
          </h2>
          <p className="text-sm text-slate-600">{t.add_elder_sub}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setSuccess(false);
          }}
          className="btn-ghost btn-sm border border-slate-300 font-semibold"
        >
          {open ? t.close : t.add_elder}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-4 pt-3 border-t border-slate-200">
          {success && (
            <p role="status" className="ok-box">
              {t.elder_added_ok}
            </p>
          )}
          {error && (
            <p role="alert" className="err-box">
              {error}
            </p>
          )}

          <label className="block">
            <span className="label">{t.full_name}</span>
            <input
              className="field"
              value={displayName}
              maxLength={60}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="label">{t.ward}</span>
            <select
              className="field"
              value={wardId}
              onChange={(e) => setWardId(Number(e.target.value))}
              required
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {wardLabel(t, w.number, w.name)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="asha_elder_lives_alone"
                    checked={livesAlone}
                    onChange={() => setLivesAlone(true)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span>{t.yes}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="asha_elder_lives_alone"
                    checked={!livesAlone}
                    onChange={() => setLivesAlone(false)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span>{t.no}</span>
                </label>
              </div>
            </fieldset>
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="label">{t.username}</span>
              <input
                className="field"
                value={username}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={30}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="label">{t.password}</span>
              <input
                type="password"
                className="field"
                value={password}
                minLength={6}
                maxLength={72}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? t.pleaseWait : t.add_elder}
          </button>
        </form>
      )}
    </section>
  );
}
