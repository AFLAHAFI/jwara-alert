"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import LocationPicker from "@/components/LocationPicker";
import { fmt, pickName, wardLabel } from "@/lib/i18n";
import { REPORT_COOLDOWN_MS, REPORT_STORAGE_KEY } from "@/lib/constants";

type Status = "idle" | "sending" | "done" | "cooldown" | "error";

function readLastReport(): number | null {
  try {
    const raw = localStorage.getItem(REPORT_STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeLastReport(ts: number) {
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, String(ts));
  } catch (err) {
    console.warn("localStorage unavailable", err);
  }
}

type CitizenInfo = {
  /** Already in the reader's language, e.g. "Ward 3 · Parakkode, Kunnathunad" */
  place: string;
};
type Disease = { id: number; slug: string; name: string };
type Place = { ward_number: number; ward_name: string | null; panchayat: { name_en?: string; name_ml?: string; name_hi?: string | null } };

/**
 * Everyone picks a suspected illness. A logged-in resident's ward comes from the account;
 * anyone else picks district, panchayat and ward. No name is stored with any report.
 */
export default function ReportForm({ citizen, diseases }: { citizen?: CitizenInfo; diseases: Disease[] }) {
  const { t, lang } = useI18n();
  const [wardId, setWardId] = useState<number | null>(null);
  const [donePlace, setDonePlace] = useState("");
  const defaultDisease = diseases.find((d) => d.slug === "other-fever") ?? diseases[0];
  const [diseaseId, setDiseaseId] = useState<number | "">(defaultDisease?.id ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [waitMin, setWaitMin] = useState(0);
  const ready = diseaseId !== "" && (citizen ? true : wardId !== null);

  useEffect(() => {
    const last = readLastReport();
    if (last && Date.now() - last < REPORT_COOLDOWN_MS) {
      setCooldownUntil(last + REPORT_COOLDOWN_MS);
      setStatus("cooldown");
    }
  }, []);

  // Keep the remaining minutes fresh and unlock the form when the cooldown ends.
  useEffect(() => {
    if (cooldownUntil === null) return;
    const tick = () => {
      const left = cooldownUntil - Date.now();
      if (left <= 0) {
        setCooldownUntil(null);
        setStatus("idle");
        return;
      }
      setWaitMin(Math.max(1, Math.ceil(left / 60000)));
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const busy = status === "sending" || status === "done" || status === "cooldown";

  async function submit() {
    if (busy || !ready) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(citizen ? { disease_id: diseaseId } : { disease_id: diseaseId, ward_id: wardId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; retryAfterMs?: number; place?: Place | null };
      if (res.status === 429) {
        const ms = Math.min(data.retryAfterMs ?? REPORT_COOLDOWN_MS, REPORT_COOLDOWN_MS);
        writeLastReport(Date.now() - (REPORT_COOLDOWN_MS - ms));
        setCooldownUntil(Date.now() + ms);
        setStatus("cooldown");
        return;
      }
      if (!res.ok) {
        // Show the server's own message (already in the user's language), e.g. a switched-off account.
        if (data.error) setErrorMsg(data.error);
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      writeLastReport(Date.now());
      if (data.place) {
        const p = data.place;
        setDonePlace(`${wardLabel(t, p.ward_number, p.ward_name)}, ${pickName({ name_en: p.panchayat.name_en ?? "", name_ml: p.panchayat.name_ml ?? "", name_hi: p.panchayat.name_hi ?? null }, lang)}`);
      }
      setStatus("done");
    } catch (err) {
      console.error("report failed", err);
      setStatus("error");
    }
  }

  if (status === "done") {
    const place = citizen ? citizen.place : donePlace;
    return (
      <section className="card space-y-3 border-primary/40 bg-teal-50 text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <p className="text-2xl font-bold text-primary">{t.thanks}</p>
        <p>{fmt(t.thanks_body, { place })}</p>
        <p className="text-slate-600">{t.thanks_tip}</p>
      </section>
    );
  }

  if (status === "cooldown") {
    return (
      <section className="card space-y-2 bg-amber-50 text-center" role="status">
        <Icon name="clock" className="mx-auto h-10 w-10 text-amber-600" />
        <p className="text-xl font-bold">{t.already_reported}</p>
        <p>{fmt(t.wait_minutes, { n: waitMin })}</p>
      </section>
    );
  }

  return (
    <section className="card space-y-4">
      {citizen ? (
        <div className="flex items-center gap-3 rounded-xl bg-teal-50 p-3">
          <Icon name="pin" className="h-6 w-6 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">{citizen.place}</p>
            <p className="text-sm text-slate-500">{t.from_account}</p>
          </div>
        </div>
      ) : (
        <fieldset className="space-y-1" disabled={busy}>
          <legend className="label text-lg">{t.select_ward}</legend>
          <LocationPicker level="ward" onChange={(v) => setWardId(v.wardId)} />
        </fieldset>
      )}
      <label className="block">
        <span className="label text-lg">{t.suspected_illness}</span>
        <select
          className="field"
          value={diseaseId}
          disabled={busy}
          onChange={(e) => setDiseaseId(e.target.value ? Number(e.target.value) : "")}
        >
          {diseases.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="btn-primary min-h-[72px] text-xl" disabled={busy || !ready} onClick={submit}>
        <Icon name="report" className="h-7 w-7" />
        {status === "sending" ? t.sending : t.report_btn}
      </button>

      {status === "error" && (
        <p role="alert" className="err-box">
          {errorMsg || t.report_fail}
        </p>
      )}

      <p className="flex gap-2 text-sm text-slate-600">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0" />
        {t.report_privacy}
      </p>
    </section>
  );
}
