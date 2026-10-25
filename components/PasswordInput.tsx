"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Props = {
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  /** Only for new passwords; login accepts older, shorter ones. */
  minLength?: number;
  className?: string;
  describedBy?: string;
};

/** Password field with a Show / Hide button, so people can check what they typed on a phone. */
export default function PasswordInput({ value, onChange, autoComplete, minLength, className = "field", describedBy }: Props) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input
        className={`${className} pr-24`}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        minLength={minLength}
        maxLength={72}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 my-1 mr-1 min-w-[4.5rem] rounded-lg px-3 text-sm font-semibold text-primary hover:bg-teal-50"
        aria-pressed={show}
        onClick={() => setShow((s) => !s)}
      >
        {show ? t.hide_password : t.show_password}
      </button>
    </span>
  );
}
