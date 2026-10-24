import Link from "next/link";
import Forbidden from "@/components/Forbidden";
import { guardPage } from "@/lib/pageAuth";

export const dynamic = "force-dynamic";

export default async function OfficerHome() {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) {
    return (
      <div className="card space-y-2">
        <h1 className="text-xl font-bold">
          അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു
          <span className="label-en">Waiting for approval</span>
        </h1>
        <p className="text-slate-600">
          സംസ്ഥാന ആരോഗ്യ വകുപ്പ് നിങ്ങളുടെ അക്കൗണ്ട് അംഗീകരിച്ച ശേഷം ഇവിടെ പ്രവേശിക്കാം.
          <span className="label-en">You can use this page once the state health department approves your account.</span>
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-bold">
          നമസ്കാരം, {user.display_name}
          <span className="label-en">{user.designation}</span>
        </h1>
      </section>
      <Link href="/dashboard" className="btn-primary flex-col gap-0 py-3 text-center">
        ഡാഷ്‌ബോർഡ്
        <span className="text-sm font-normal text-teal-100">Dashboard</span>
      </Link>
      <Link href="/alerts" className="btn-outline">അറിയിപ്പുകൾ · Alerts</Link>
      <Link href="/tasks" className="btn-outline">ജോലികൾ · Tasks</Link>
    </div>
  );
}
