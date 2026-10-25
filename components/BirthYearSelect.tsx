"use client";

import { useMemo } from "react";
import { useI18n } from "@/components/I18nProvider";

/** Year of birth as a dropdown (newest first). Optional: the empty choice sends no year. */
export default function BirthYearSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  // India date, so the list is right on 1 January before 05:30 too.
  const years = useMemo(() => {
    const now = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric" }).format(new Date()));
    const list: number[] = [];
    for (let y = now; y >= 1900; y--) list.push(y);
    return list;
  }, []);
  return (
    <label className="block">
      <span className="label">{t.year_of_birth}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— {t.year_of_birth_none} —</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
