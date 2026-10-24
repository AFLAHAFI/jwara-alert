import Forbidden from "@/components/Forbidden";
import PendingOfficers from "@/components/PendingOfficers";
import { guardPage } from "@/lib/pageAuth";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await guardPage(["state_admin"]);
  if (!user) return <Forbidden />;
  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-bold">
          കേരള ആരോഗ്യ വകുപ്പ്
          <span className="label-en">State admin · {user.display_name}</span>
        </h1>
      </section>
      <section className="card space-y-3">
        <h2 className="text-lg font-bold">
          ഉദ്യോഗസ്ഥരുടെ അംഗീകാരം
          <span className="label-en">Officer approvals</span>
        </h2>
        <PendingOfficers />
      </section>
    </div>
  );
}
