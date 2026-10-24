"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";
import { FACILITY_KINDS, type FacilityKind } from "@/lib/facilityKinds";

export default function FacilityForm() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<FacilityKind>("phc");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [open24, setOpen24] = useState(false);
  const [msg, setMsg] = useState("");
  const { busy, error, call } = useApi();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const ok = await call("/api/officer/facilities", "POST", { name, kind, phone, address, open_24h: open24 });
    if (ok) {
      setMsg(t.fac_added);
      setName("");
      setPhone("");
      setAddress("");
      setOpen24(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="section-title">
        <Icon name="plus" />
        {t.fac_add}
      </h2>
      <label className="block">
        <span className="label text-sm">{t.fac_name}</span>
        <input className="field" value={name} minLength={2} maxLength={100} required onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="label text-sm">{t.fac_kind}</span>
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value as FacilityKind)}>
            {FACILITY_KINDS.map((k) => (
              <option key={k} value={k}>
                {t[`fac_kind_${k}`]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label text-sm">{t.fac_phone}</span>
          <input
            className="field text-base"
            type="tel"
            inputMode="tel"
            value={phone}
            maxLength={20}
            pattern="[0-9+ \-]{3,20}"
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      </div>
      <label className="block">
        <span className="label text-sm">{t.fac_address}</span>
        <input className="field" value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <label className="flex min-h-[44px] items-center gap-3">
        <input type="checkbox" className="h-5 w-5" checked={open24} onChange={(e) => setOpen24(e.target.checked)} />
        <span>{t.fac_24h}</span>
      </label>
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
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        <Icon name="plus" />
        {busy ? t.saving : t.save}
      </button>
    </form>
  );
}
