"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { fmt, formatDateTime } from "@/lib/i18n";
import type { SosRequest } from "@/lib/elder";

export default function ElderActions({
  initialSos,
  initialCheckin,
}: {
  initialSos: SosRequest | null;
  initialCheckin: { checked_in: boolean; checkin_at: string | null };
}) {
  const { t, lang } = useI18n();
  const router = useRouter();

  // SOS state
  const [sos, setSos] = useState<SosRequest | null>(initialSos);
  const [sosSending, setSosSending] = useState(false);
  const [sosSentSuccess, setSosSentSuccess] = useState(false);

  // Checkin state
  const [checkin, setCheckin] = useState(initialCheckin);
  const [checkinSending, setCheckinSending] = useState(false);

  async function triggerSos() {
    if (sosSending) return;
    const ok = window.confirm(t.sos_confirm);
    if (!ok) return;

    setSosSending(true);

    // 1. Send the SOS at once, WITHOUT waiting for location. The browser's location prompt
    //    can stay open forever if the elder does not answer it, so it must never block the SOS.
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.sos) {
        alert(json.error ?? t.genericError);
        setSosSending(false);
        return;
      }
      setSos(json.sos);
      setSosSentSuccess(true);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(t.networkError);
      setSosSending(false);
      return;
    }
    setSosSending(false);

    // 2. Then try to add the location (best effort, gives up after 20 seconds).
    if (!("geolocation" in navigator)) return;
    const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), 20_000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { timeout: 10_000, enableHighAccuracy: true },
      );
    });
    if (!coords) return;
    try {
      await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coords),
      });
      router.refresh();
    } catch {
      // The SOS is already sent; a missing location is not an error for the elder.
    }
  }

  async function triggerCheckin() {
    if (checkinSending || checkin.checked_in) return;
    setCheckinSending(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setCheckin({
          checked_in: true,
          checkin_at: json.created_at ?? new Date().toISOString(),
        });
        router.refresh();
      } else {
        alert(json.error ?? t.genericError);
      }
    } catch (err) {
      console.error(err);
      alert(t.networkError);
    } finally {
      setCheckinSending(false);
    }
  }

  const checkinTimeFormatted = checkin.checkin_at
    ? new Intl.DateTimeFormat(lang === "ml" ? "ml-IN" : lang === "hi" ? "hi-IN" : "en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(checkin.checkin_at))
    : "";

  return (
    <div className="space-y-4">
      {/* SOS block */}
      {sosSentSuccess || (sos && sos.status !== "resolved") ? (
        <div className="rounded-2xl border-4 border-alert bg-red-50 p-6 text-center shadow-lg space-y-4">
          <div className="flex items-center justify-center gap-2 text-alert">
            <Icon name="alert" className="h-10 w-10 animate-pulse text-alert shrink-0" />
            <h2 className="text-2xl font-black text-alert uppercase tracking-wide">
              {t.sos_sent_title}
            </h2>
          </div>
          <p className="text-lg font-bold text-slate-800 leading-snug">
            {t.sos_sent_msg}
          </p>
          {sos?.created_at && (
            <p className="text-sm font-semibold text-slate-600">
              {fmt(t.sos_active_banner, {
                time: formatDateTime(sos.created_at, lang),
                status: sos.status === "accepted" ? t.status_accepted : t.status_open,
              })}
            </p>
          )}
          <a
            href="tel:108"
            className="btn-danger flex items-center justify-center gap-3 py-4 text-2xl font-black shadow-md w-full"
          >
            <Icon name="phone" className="h-8 w-8" />
            <span>{t.call_108}</span>
          </a>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerSos}
          disabled={sosSending}
          className="w-full rounded-2xl bg-alert hover:bg-alert/90 active:scale-95 text-white font-black text-3xl py-7 px-4 shadow-xl border-4 border-red-700 flex items-center justify-center gap-3 transition-transform"
        >
          <Icon name="alert" className="h-10 w-10 shrink-0" />
          <span>{sosSending ? t.sos_sending : t.sos_btn}</span>
        </button>
      )}

      {/* Daily "I am OK" block */}
      {checkin.checked_in ? (
        <div className="rounded-2xl border-4 border-emerald-600 bg-emerald-50 p-6 text-center shadow-md">
          <div className="flex items-center justify-center gap-2 text-emerald-700">
            <Icon name="check" className="h-9 w-9 text-emerald-600 shrink-0 stroke-[3]" />
            <p className="text-2xl font-black text-emerald-800">
              {checkinTimeFormatted
                ? fmt(t.checkin_at, { time: checkinTimeFormatted })
                : t.checkin_done}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerCheckin}
          disabled={checkinSending}
          className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-2xl py-6 px-4 shadow-xl border-4 border-emerald-800 flex items-center justify-center gap-3 transition-transform"
        >
          <Icon name="check" className="h-9 w-9 shrink-0 stroke-[3]" />
          <span>{checkinSending ? t.pleaseWait : t.checkin_btn}</span>
        </button>
      )}
    </div>
  );
}
