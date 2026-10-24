"use client";

import { useEffect, useState } from "react";
import { REPORT_COOLDOWN_MS, REPORT_STORAGE_KEY, WARDS } from "@/lib/constants";

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
  /** e.g. "Ward 3, Example Panchayat 1" */
  wardLabel: string;
  wardLabelMl: string;
  diseases: { id: number; name_en: string; name_ml: string; slug: string }[];
};

/**
 * Anonymous visitors pick a ward (original demo). A logged-in citizen's ward comes from
 * the account, and they pick a suspected disease instead. Neither stores a name.
 */
export default function ReportForm({ citizen }: { citizen?: CitizenInfo }) {
  const [ward, setWard] = useState<number | "">("");
  const defaultDisease = citizen?.diseases.find((d) => d.slug === "other-fever") ?? citizen?.diseases[0];
  const [diseaseId, setDiseaseId] = useState<number | "">(defaultDisease?.id ?? "");
  const ready = citizen ? diseaseId !== "" : ward !== "";
  const [status, setStatus] = useState<Status>("idle");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [waitMin, setWaitMin] = useState(0);
  const [message, setMessage] = useState("");

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
    setMessage("");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(citizen ? { disease_id: diseaseId } : { ward }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfterMs?: number;
      };
      if (res.status === 429) {
        const ms = Math.min(data.retryAfterMs ?? REPORT_COOLDOWN_MS, REPORT_COOLDOWN_MS);
        writeLastReport(Date.now() - (REPORT_COOLDOWN_MS - ms));
        setCooldownUntil(Date.now() + ms);
        setStatus("cooldown");
        return;
      }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      writeLastReport(Date.now());
      setStatus("done");
    } catch (err) {
      console.error("report failed", err);
      setMessage("ക്ഷമിക്കണം, അയയ്ക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-5">
      {status === "done" ? (
        <section className="card border-primary/40 bg-teal-50 text-center">
          <p className="text-2xl font-bold text-primary">നന്ദി!</p>
          <p className="mt-2">
            നിങ്ങളുടെ റിപ്പോർട്ട് ലഭിച്ചു. {citizen ? citizen.wardLabelMl : `വാർഡ് ${ward}`} നിരീക്ഷണത്തിലാണ്.
          </p>
          <p className="label-en mt-1">
            Thank you. Your report for {citizen ? citizen.wardLabel : `Ward ${ward}`} was recorded.
          </p>
          <p className="mt-3 text-base text-slate-600">
            വെള്ളം തിളപ്പിച്ച് കുടിക്കുക. പനി 2 ദിവസത്തിൽ കൂടുതൽ നീണ്ടാൽ ഡോക്ടറെ കാണുക.
          </p>
        </section>
      ) : status === "cooldown" ? (
        <section className="card bg-amber-50 text-center">
          <p className="text-xl font-bold">ഇതിനകം റിപ്പോർട്ട് ചെയ്തു</p>
          <p className="mt-2">
            ഏകദേശം {waitMin} മിനിറ്റ് കഴിഞ്ഞ് വീണ്ടും റിപ്പോർട്ട് ചെയ്യാം.
          </p>
          <p className="label-en mt-1">
            Already reported. You can report again in about {waitMin} min.
          </p>
        </section>
      ) : (
        <section className="card space-y-4">
          {citizen ? (
            <>
              <div className="rounded-xl bg-teal-50 p-3">
                <p className="font-semibold">{citizen.wardLabelMl}</p>
                <p className="label-en">{citizen.wardLabel} (from your account)</p>
              </div>
              <label className="block">
                <span className="text-lg font-semibold">
                  സംശയിക്കുന്ന രോഗം
                  <span className="label-en">Suspected illness</span>
                </span>
                <select
                  className="field mt-2"
                  value={diseaseId}
                  disabled={busy}
                  onChange={(e) => setDiseaseId(e.target.value ? Number(e.target.value) : "")}
                >
                  {citizen.diseases.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_ml} / {d.name_en}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
          <label className="block">
            <span className="text-lg font-semibold">
              വാർഡ് തിരഞ്ഞെടുക്കുക
              <span className="label-en">Select your ward</span>
            </span>
            <select
              className="field mt-2"
              value={ward}
              disabled={busy}
              onChange={(e) => setWard(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">-- വാർഡ് / Ward --</option>
              {WARDS.map((w) => (
                <option key={w} value={w}>
                  വാർഡ് {w} / Ward {w}
                </option>
              ))}
            </select>
          </label>
          )}

          <button
            type="button"
            className="btn-primary min-h-[72px] flex-col gap-0 py-3"
            disabled={busy || !ready}
            onClick={submit}
          >
            <span className="text-2xl">
              {status === "sending" ? "അയയ്ക്കുന്നു…" : citizen ? "റിപ്പോർട്ട് ചെയ്യുക" : "വീട്ടിൽ പനി ഉണ്ട്"}
            </span>
            <span className="text-sm font-normal text-teal-100">
              {citizen ? "Report illness in my house" : "Fever in my house"}
            </span>
          </button>

          {message && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
              {message}
              <span className="label-en">Could not send. Please try again.</span>
            </p>
          )}

          <p className="text-base text-slate-600">
            പേരോ ഫോൺ നമ്പറോ ശേഖരിക്കുന്നില്ല. 10 മിനിറ്റിൽ ഒരു റിപ്പോർട്ട് മാത്രം.
            <span className="label-en">No name or phone collected. One report per 10 minutes.</span>
          </p>
        </section>
      )}
    </div>
  );
}
