"use client";

import { useEffect, useState, type ReactNode } from "react";

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
        if (candidate) setError("PIN തെറ്റാണ്. വീണ്ടും ശ്രമിക്കുക.");
      } else if (res.status === 429) {
        setVerified(false);
        setError("കൂടുതൽ ശ്രമങ്ങൾ. 15 മിനിറ്റ് കഴിഞ്ഞ് ശ്രമിക്കുക.");
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("pin verify failed", err);
      setVerified(false);
      setError("ക്ഷമിക്കണം, പരിശോധിക്കാൻ കഴിഞ്ഞില്ല.");
    } finally {
      setChecking(false);
    }
  }

  if (verified === null) {
    return <p className="py-10 text-center text-slate-500">പരിശോധിക്കുന്നു…</p>;
  }

  if (!verified) {
    return (
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!checking && pin) verify(pin);
        }}
      >
        <h1 className="text-xl font-bold">
          ആരോഗ്യ പ്രവർത്തകർക്ക് മാത്രം
          <span className="label-en">Health workers only — enter admin PIN</span>
        </h1>
        <input
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
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
            {error}
            <span className="label-en">Wrong PIN, too many attempts, or could not verify.</span>
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={checking || !pin}>
          {checking ? "പരിശോധിക്കുന്നു…" : "തുറക്കുക / Open"}
        </button>
      </form>
    );
  }

  return <>{children(getStoredPin())}</>;
}
