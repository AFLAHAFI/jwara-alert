import Link from "next/link";
import EmergencyNumbers from "@/components/EmergencyNumbers";

export default function Home() {
  return (
    <div className="space-y-5">
      <section className="card">
        <h1 className="text-2xl font-bold">
          പഞ്ചായത്തിലെ പനി നേരത്തെ കണ്ടെത്താം
          <span className="label-en mt-1">
            Spot fever clusters in the panchayat early, then act.
          </span>
        </h1>
        <p className="mt-3 text-slate-600">
          വ്യക്തിഗത വിവരങ്ങൾ ഒന്നും ശേഖരിക്കുന്നില്ല. വാർഡും സമയവും മാത്രം.
          <span className="label-en">No personal data. Only ward and time.</span>
        </p>
      </section>

      <Link href="/report" className="btn-primary flex-col gap-0 py-3 text-center">
        വീട്ടിൽ പനി ഉണ്ടെന്ന് അറിയിക്കുക
        <span className="text-sm font-normal text-teal-100">Report fever</span>
      </Link>
      <Link href="/alerts" className="btn-outline flex-col gap-0 py-3 text-center">
        അറിയിപ്പുകൾ കാണുക
        <span className="text-sm font-normal">View alerts</span>
      </Link>
      <Link href="/dashboard" className="block text-center text-sm text-slate-500 underline">
        ആരോഗ്യ പ്രവർത്തകർക്ക് · Health worker dashboard
      </Link>

      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <Link href="/login" className="btn-outline">ലോഗിൻ · Log in</Link>
        <Link href="/register" className="btn-outline">രജിസ്റ്റർ · Sign up</Link>
      </div>
      <Link href="/officer/register" className="block text-center text-sm text-slate-500 underline">
        പഞ്ചായത്ത് ഉദ്യോഗസ്ഥർക്ക് · Officer sign-up
      </Link>

      <EmergencyNumbers />
    </div>
  );
}
