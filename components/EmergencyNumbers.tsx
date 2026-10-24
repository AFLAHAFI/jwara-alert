export default function EmergencyNumbers() {
  return (
    <section className="card border-alert/30">
      <h2 className="text-lg font-bold text-alert">
        അടിയന്തര സഹായം
        <span className="label-en">Emergency help</span>
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <a href="tel:108" className="btn-danger flex-col gap-0 px-2 py-2 leading-tight">
          <span className="text-3xl">108</span>
          <span className="text-sm font-normal">ആംബുലൻസ് · Ambulance</span>
        </a>
        <a href="tel:112" className="btn-danger flex-col gap-0 px-2 py-2 leading-tight">
          <span className="text-3xl">112</span>
          <span className="text-sm font-normal">അടിയന്തരം · Emergency</span>
        </a>
      </div>
    </section>
  );
}
