"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

/** Small JSON caller for forms: blocks double submits, shows the server's error, refreshes the page on success. */
export function useApi() {
  const router = useRouter();
  const { t } = useI18n();
  const inFlight = useRef(false);
  const [sending, setSending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function call(url: string, method: string, body?: unknown): Promise<boolean> {
    if (inFlight.current) return false;
    inFlight.current = true;
    setSending(true);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? t.genericError);
        return false;
      }
      // Stay busy until the page has re-rendered, so a second tap cannot hit stale buttons.
      startTransition(() => router.refresh());
      return true;
    } catch {
      setError(t.networkError);
      return false;
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return { busy: sending || refreshing, error, call, setError };
}
