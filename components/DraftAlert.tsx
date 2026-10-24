"use client";

import { useState } from "react";
import { MAX_ALERT_BODY } from "@/lib/alertTemplate";
import { useApi } from "@/components/useApi";

type Props = { id: string; title: string; target: string; body: string };

export default function DraftAlert({ id, title, target, body }: Props) {
  const [text, setText] = useState(body);
  const [confirming, setConfirming] = useState(false);
  const { busy, error, call } = useApi();
  const dirty = text !== body;

  return (
    <div className="card space-y-3 border-amber-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{title}</p>
          <p className="label-en">{target}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          കരട് · Draft
        </span>
      </div>
      <textarea
        className="field min-h-[260px] py-3 text-base leading-relaxed"
        value={text}
        maxLength={MAX_ALERT_BODY}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">{error}</p>}
      {confirming ? (
        <div className="space-y-2 rounded-xl bg-red-50 p-3">
          <p className="font-semibold">
            ഇത് ജനങ്ങൾക്ക് അയയ്ക്കണോ? <span className="label-en">Send this to residents now?</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-danger text-lg"
              disabled={busy || !text.trim()}
              onClick={() => call(`/api/officer/alerts/${id}/publish`, "POST", { body_ml: text })}
            >
              {busy ? "…" : "അതെ · Publish"}
            </button>
            <button type="button" className="btn-outline text-lg" disabled={busy} onClick={() => setConfirming(false)}>
              വേണ്ട · Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <button type="button" className="btn-primary flex-col gap-0 py-2" disabled={busy || !text.trim()} onClick={() => setConfirming(true)}>
            അംഗീകരിച്ച് പ്രസിദ്ധീകരിക്കുക
            <span className="text-sm font-normal text-teal-100">Approve and publish</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-outline text-base"
              disabled={busy || !dirty || !text.trim()}
              onClick={() => call(`/api/officer/alerts/${id}`, "PATCH", { body_ml: text })}
            >
              സേവ് · Save
            </button>
            <button
              type="button"
              className="btn border-2 border-slate-300 bg-white text-base text-slate-600"
              disabled={busy}
              onClick={() => call(`/api/officer/alerts/${id}`, "DELETE")}
            >
              ഒഴിവാക്കുക · Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
