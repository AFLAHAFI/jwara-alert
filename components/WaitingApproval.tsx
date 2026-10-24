import Icon from "@/components/Icon";
import { getT } from "@/lib/i18n/server";

export default function WaitingApproval() {
  const { t } = getT();
  return (
    <div className="narrow card space-y-3 text-center">
      <Icon name="clock" className="mx-auto h-12 w-12 text-amber-600" />
      <h1 className="text-xl font-bold">{t.waiting_title}</h1>
      <p className="text-slate-600">{t.waiting_body}</p>
    </div>
  );
}
