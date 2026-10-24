"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Small JSON caller for forms: blocks double submits, shows the server's error, refreshes the page on success. */
export function useApi() {
  const router = useRouter();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(url: string, method: string, body?: unknown): Promise<boolean> {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? `Error ${res.status}`);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network problem. Try again.");
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return { busy, error, call, setError };
}
