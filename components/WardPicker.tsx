"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import LocationPicker from "@/components/LocationPicker";
import { useI18n } from "@/components/I18nProvider";

/** Pick district, panchayat and ward, then open /ward?w=<id>. No login, nothing is saved. */
export default function WardPicker() {
  const { t } = useI18n();
  const router = useRouter();
  const [wardId, setWardId] = useState<number | null>(null);
  const [going, setGoing] = useState(false);

  return (
    <form
      className="card space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!wardId || going) return;
        setGoing(true);
        router.push(`/ward?w=${wardId}`);
      }}
    >
      <h2 className="section-title">
        <Icon name="pin" />
        {t.ws_pick_title}
      </h2>
      <LocationPicker
        level="ward"
        onChange={(v) => {
          setWardId(v.wardId);
          setGoing(false);
        }}
      />
      <button type="submit" className="btn-primary w-full" disabled={!wardId || going}>
        <Icon name="shield" />
        {going ? t.pleaseWait : t.ws_check}
      </button>
    </form>
  );
}
