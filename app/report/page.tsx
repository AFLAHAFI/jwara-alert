import Link from "next/link";
import EmergencyNumbers from "@/components/EmergencyNumbers";
import ReportForm from "@/components/ReportForm";
import { getCurrentUser } from "@/lib/authz";
import { getDiseases, getPanchayat, getWardNumber } from "@/lib/area";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const user = await getCurrentUser();
  let citizen: Parameters<typeof ReportForm>[0]["citizen"];
  if (user?.role === "citizen" && user.ward_id && user.panchayat_id) {
    try {
      const [diseases, panchayat, wardNo] = await Promise.all([
        getDiseases({ citizenOnly: true }),
        getPanchayat(user.panchayat_id),
        getWardNumber(user.ward_id),
      ]);
      citizen = {
        diseases,
        wardLabel: `Ward ${wardNo}, ${panchayat?.name_en ?? ""}`,
        wardLabelMl: `വാർഡ് ${wardNo}, ${panchayat?.name_ml ?? ""}`,
      };
    } catch (err) {
      console.error("[report page] citizen info failed", err);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        {citizen ? "രോഗം റിപ്പോർട്ട് ചെയ്യുക" : "പനി റിപ്പോർട്ട് ചെയ്യുക"}
        <span className="label-en">
          {citizen ? "Report illness in your house" : "Report fever in your house"}
        </span>
      </h1>
      <ReportForm citizen={citizen} />
      {!user && (
        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="underline">ലോഗിൻ ചെയ്‌താൽ രോഗം തിരഞ്ഞെടുക്കാം</Link>
          <span className="label-en">Log in to report a specific illness for your ward.</span>
        </p>
      )}
      <EmergencyNumbers />
    </div>
  );
}
