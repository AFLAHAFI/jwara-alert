import Icon from "@/components/Icon";
import { getT } from "@/lib/i18n/server";

export default function EmergencyNumbers() {
  const { t } = getT();
  return (
    <section className="card border-alert/30" aria-labelledby="emergency-title">
      <h2 id="emergency-title" className="section-title text-alert">
        <Icon name="phone" />
        {t.emergency_title}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <a href="tel:108" className="btn-danger flex-col gap-0 px-2 py-2 leading-tight">
          <span className="text-3xl">108</span>
          <span className="text-sm font-normal">{t.emergency_ambulance}</span>
        </a>
        <a href="tel:112" className="btn-danger flex-col gap-0 px-2 py-2 leading-tight">
          <span className="text-3xl">112</span>
          <span className="text-sm font-normal">{t.emergency_general}</span>
        </a>
      </div>
    </section>
  );
}
