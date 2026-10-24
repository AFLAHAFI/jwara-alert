import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import WaitingApproval from "@/components/WaitingApproval";
import SosList from "@/components/SosList";
import { guardPage } from "@/lib/pageAuth";
import { getSosRequests, type SosRequest } from "@/lib/elder";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function OfficerSosPage() {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;

  const { t } = getT();
  let list: SosRequest[] = [];
  let failed = false;

  try {
    list = await getSosRequests(user.panchayat_id, ["open", "accepted"]);
  } catch (err) {
    console.error("[officer/sos] failed", err);
    failed = true;
  }

  return (
    <div className="narrow space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2 text-alert">
          <Icon name="alert" className="h-7 w-7 text-alert" />
          {t.sos_alerts}
        </h1>
      </div>

      {failed && (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      )}

      <SosList list={list} />
    </div>
  );
}
