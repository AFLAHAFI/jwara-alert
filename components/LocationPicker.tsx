"use client";

import { useEffect, useMemo, useState } from "react";

type District = { id: number; name_en: string; name_ml: string };
type Panchayat = { id: number; district_id: number; name_en: string; name_ml: string };
type Ward = { id: number; panchayat_id: number; number: number };

type Props = {
  /** "ward" asks for district + panchayat + ward; "panchayat" stops at panchayat. */
  level: "ward" | "panchayat";
  onChange: (v: { districtId: number | null; panchayatId: number | null; wardId: number | null }) => void;
};

export default function LocationPicker({ level, onChange }: Props) {
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

  const pList = useMemo(() => panchayats.filter((x) => String(x.district_id) === d), [panchayats, d]);
  const wList = useMemo(() => wards.filter((x) => String(x.panchayat_id) === p), [wards, p]);

  function emit(nd: string, np: string, nw: string) {
    onChange({
      districtId: nd ? Number(nd) : null,
      panchayatId: np ? Number(np) : null,
      wardId: nw ? Number(nw) : null,
    });
  }

  if (state === "loading") return <p className="text-slate-500">ലോഡ് ചെയ്യുന്നു… Loading…</p>;
  if (state === "error")
    return (
      <p className="text-red-700">
        സ്ഥലങ്ങൾ ലോഡ് ചെയ്യാനായില്ല. Could not load places. Reload the page.
      </p>
    );

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="font-semibold">ജില്ല <span className="label-en inline">District</span></span>
        <select
          className="field mt-1"
          value={d}
          onChange={(e) => {
            setD(e.target.value);
            setP("");
            setW("");
            emit(e.target.value, "", "");
          }}
        >
          <option value="">— തിരഞ്ഞെടുക്കുക / Select —</option>
          {districts.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name_ml} · {x.name_en}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="font-semibold">പഞ്ചായത്ത് <span className="label-en inline">Panchayat</span></span>
        <select
          className="field mt-1"
          value={p}
          disabled={!d}
          onChange={(e) => {
            setP(e.target.value);
            setW("");
            emit(d, e.target.value, "");
          }}
        >
          <option value="">— തിരഞ്ഞെടുക്കുക / Select —</option>
          {pList.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name_ml} · {x.name_en}
            </option>
          ))}
        </select>
      </label>
      {level === "ward" && (
        <label className="block">
          <span className="font-semibold">വാർഡ് <span className="label-en inline">Ward</span></span>
          <select
            className="field mt-1"
            value={w}
            disabled={!p}
            onChange={(e) => {
              setW(e.target.value);
              emit(d, p, e.target.value);
            }}
          >
            <option value="">— തിരഞ്ഞെടുക്കുക / Select —</option>
            {wList.map((x) => (
              <option key={x.id} value={x.id}>
                വാർഡ് {x.number} · Ward {x.number}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
