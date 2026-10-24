import Icon from "@/components/Icon";
import type { Dict } from "@/lib/i18n";
import { mapLink, telHref, type Facility } from "@/lib/wardStatus";

type Props = {
  t: Dict;
  facilities: Facility[];
  /** Panchayat and district names, used for the "search on map" links. */
  placeName: string;
  districtName: string;
  failed?: boolean;
};

/** Hospitals and health centres of a panchayat, with call and map buttons, plus Kerala helplines. */
export default function FacilityList({ t, facilities, placeName, districtName, failed }: Props) {
  return (
    <section className="card space-y-3" aria-labelledby="fac-title">
      <h2 id="fac-title" className="section-title">
        <Icon name="plus" />
        {t.fac_title}
      </h2>

      {failed && (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      )}

      {!failed && facilities.length === 0 && <p className="text-slate-600">{t.fac_none}</p>}

      {facilities.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {facilities.map((f) => (
            <li key={f.id} className="space-y-2 py-3 first:pt-0">
              <div>
                <p className="font-bold">{f.name}</p>
                <p className="text-sm text-slate-600">
                  {t[`fac_kind_${f.kind}`]}
                  {f.open_24h && <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-primary">{t.fac_24h}</span>}
                </p>
                {f.address && <p className="text-sm text-slate-500">{f.address}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {f.phone ? (
                  <a href={telHref(f.phone)} className="btn-outline min-h-[48px]">
                    <Icon name="phone" />
                    {f.phone}
                  </a>
                ) : (
                  <span className="flex min-h-[48px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">{t.fac_no_phone}</span>
                )}
                <a href={mapLink(f.name, f.address, placeName, districtName, "Kerala")} target="_blank" rel="noopener noreferrer" className="btn-outline min-h-[48px]">
                  <Icon name="pin" />
                  {t.fac_map}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <a
        href={mapLink(`Primary Health Centre near ${placeName}`, districtName, "Kerala")}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost w-full"
      >
        <Icon name="pin" />
        {t.fac_search_map}
      </a>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <a href="tel:1056" className="btn-outline min-h-[56px] flex-col gap-0 leading-tight">
          <span className="text-xl font-bold">1056</span>
          <span className="text-xs font-normal">{t.fac_disha}</span>
        </a>
        <a href="tel:108" className="btn-danger min-h-[56px] flex-col gap-0 leading-tight">
          <span className="text-xl font-bold">108</span>
          <span className="text-xs font-normal">{t.emergency_ambulance}</span>
        </a>
      </div>
    </section>
  );
}
