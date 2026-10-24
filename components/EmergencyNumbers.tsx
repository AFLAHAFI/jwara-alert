export default function EmergencyNumbers() {
  return (
    <section className="card border-alert/30">
      <h2 className="text-lg font-bold text-alert">
        അടിയന്തര സഹായം
        <span className="label-en">Emergency help</span>
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <a href="tel:108" className="btn-danger text-2xl">
          108
          <span className="ml-2 text-sm font-normal">ആംബുലൻസ്</span>
        </a>
        <a href="tel:112" className="btn-danger text-2xl">
          112
          <span className="ml-2 text-sm font-normal">അടിയന്തരം</span>
        </a>
      </div>
    </section>
  );
}
