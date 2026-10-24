"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { pickName, wardLabel } from "@/lib/i18n";

type Named = { name_en: string; name_ml: string; name_hi: string | null };
type District = Named & { id: number };
type Panchayat = Named & { id: number; district_id: number };
type Ward = { id: number; panchayat_id: number; number: number; name: string | null };

type Props = {
  /** "ward" asks for district + panchayat + ward; "panchayat" stops at panchayat. */
  level: "ward" | "panchayat";
  onChange: (v: { districtId: number | null; panchayatId: number | null; wardId: number | null }) => void;
};

export default function LocationPicker({ level, onChange }: Props) {
  const { t, lang } = useI18n();
  const [districts, setDistricts] = useState<District[]>([]);
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [d, setD] = useState("");
  const [p, setP] = useState("");
  const [w, setW] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/locations")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad"))))
      .then((j) => {
        if (!alive) return;
        setDistricts(j.districts ?? []);
        setPanchayats(j.panchayats ?? []);
        setWards(j.wards ?? []);
        setState("ready");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, []);

  const dList = useMemo(
    () => [...districts].sort((a, b) => pickName(a, lang).localeCompare(pickName(b, lang))),
    [districts, lang],
  );
  const pList = useMemo(() => panchayats.filter((x) => String(x.district_id) === d), [panchayats, d]);
  const wList = useMemo(() => wards.filter((x) => String(x.panchayat_id) === p), [wards, p]);

  function emit(nd: string, np: string, nw: string) {
    onChange({
      districtId: nd ? Number(nd) : null,
      panchayatId: np ? Number(np) : null,
      wardId: nw ? Number(nw) : null,
    });
  }

  if (state === "loading") return <div className="skeleton h-40" aria-label={t.loading} />;
  if (state === "error") return <p className="err-box">{t.places_load_err}</p>;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="label">{t.district}</span>
        <select
          className="field"
          value={d}
          onChange={(e) => {
            setD(e.target.value);
            setP("");
            setW("");
            emit(e.target.value, "", "");
          }}
        >
          <option value="">— {t.select} —</option>
          {dList.map((x) => (
            <option key={x.id} value={x.id}>
              {pickName(x, lang)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">{t.panchayat}</span>
        <select
          className="field"
          value={p}
          disabled={!d}
          onChange={(e) => {
            setP(e.target.value);
            setW("");
            emit(d, e.target.value, "");
          }}
        >
          <option value="">— {t.select} —</option>
          {pList.map((x) => (
            <option key={x.id} value={x.id}>
              {pickName(x, lang)}
            </option>
          ))}
        </select>
      </label>
      {level === "ward" && (
        <label className="block">
          <span className="label">{t.ward}</span>
          <select
            className="field"
            value={w}
            disabled={!p}
            onChange={(e) => {
              setW(e.target.value);
              emit(d, p, e.target.value);
            }}
          >
            <option value="">— {t.select} —</option>
            {wList.map((x) => (
              <option key={x.id} value={x.id}>
                {wardLabel(t, x.number, x.name)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
