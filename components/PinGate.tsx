"use client";

import { useEffect, useState, type ReactNode } from "react";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";

export const PIN_STORAGE_KEY = "jwara:adminPin";
export const PIN_HEADER = "x-admin-pin";

export function getStoredPin(): string {
  try {
    return sessionStorage.getItem(PIN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearStoredPin() {
  try {
    sessionStorage.removeItem(PIN_STORAGE_KEY);
  } catch {}
}

/** Adds the admin PIN header to a fetch; the server does the real check. */
export function adminFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set(PIN_HEADER, getStoredPin());
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(input, { ...init, headers });
}

type Props = { children: (pin: string) => ReactNode };

export default function PinGate({ children }: Props) {
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = getStoredPin();
    if (!stored) {
      setVerified(false);
      return;
    }
    verify(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(candidate: string) {
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { [PIN_HEADER]: candidate },
      });
      if (res.ok) {
        try {
          sessionStorage.setItem(PIN_STORAGE_KEY, candidate);
        } catch {}
        setVerified(true);
      } else if (res.status === 401) {
        clearStoredPin();
        setVerified(false);
        if (candidate) setError(t.pin_wrong);
      } else if (res.status === 429) {
        setVerified(false);
        setError(t.pin_locked);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("pin verify failed", err);
      setVerified(false);
      setError(t.pin_error);
    } finally {
      setChecking(false);
    }
  }

  if (verified === null) {
    return <div className="narrow skeleton h-48" aria-label={t.pin_checking} />;
  }

  if (!verified) {
    return (
      <form
        className="narrow card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!checking && pin) verify(pin);
        }}
      >
        <h1 className="section-title text-xl">
          <Icon name="lock" />
          {t.pin_title}
        </h1>
        <label htmlFor="pin" className="label">
          {t.pin_label}
        </label>
        <input
          id="pin"
          className="field text-center text-2xl tracking-[0.5em]"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          disabled={checking}
        />
        {error && (
          <p role="alert" className="err-box">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={checking || !pin}>
          {checking ? t.pin_checking : t.pin_open}
        </button>
      </form>
    );
  }

  return <>{children(getStoredPin())}</>;
}
