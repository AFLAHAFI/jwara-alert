import Link from "next/link";
import Forbidden from "@/components/Forbidden";
import { guardPage } from "@/lib/pageAuth";

export const dynamic = "force-dynamic";

export default async function AshaHome() {
  const user = await guardPage(["asha"]);
  if (!user) return <Forbidden />;
  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-bold">
          നമസ്കാരം, {user.display_name}
          <span className="label-en">ASHA worker</span>
        </h1>
      </section>
      <Link href="/tasks" className="btn-primary flex-col gap-0 py-3 text-center">
        എന്റെ ജോലികൾ
        <span className="text-sm font-normal text-teal-100">My tasks</span>
      </Link>
    </div>
  );
}
