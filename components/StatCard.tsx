import Icon, { type IconName } from "@/components/Icon";

export default function StatCard({ icon, value, label, tone = "primary" }: { icon: IconName; value: string | number; label: string; tone?: "primary" | "alert" | "amber" }) {
  const c = tone === "alert" ? "bg-red-100 text-alert" : tone === "amber" ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-primary";
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${c}`}>
        <Icon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
        <p className="text-sm leading-snug text-slate-600">{label}</p>
      </div>
    </div>
  );
}
