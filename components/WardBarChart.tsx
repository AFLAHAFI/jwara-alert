import { isRedWard, RED_THRESHOLD, type WardCount } from "@/lib/redLogic";

export default function WardBarChart({ wards }: { wards: WardCount[] }) {
  const max = Math.max(RED_THRESHOLD, ...wards.map((w) => w.count));
  return (
    <div className="space-y-2" role="img" aria-label="Reports per ward">
      {wards.map(({ ward, count }) => {
        const red = isRedWard(count);
        const pct = Math.max(count > 0 ? 6 : 0, Math.round((count / max) * 100));
        return (
          <div key={ward} className="flex items-center gap-2">
            <span className={`w-20 shrink-0 text-base ${red ? "font-bold text-alert" : ""}`}>
              വാർഡ് {ward}
            </span>
            <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-slate-100">
              <div
                className={`h-full rounded-lg transition-all ${red ? "bg-alert" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
              <span
                className="absolute inset-y-0 right-2 flex items-center text-sm font-semibold"
                style={{
                  left: `calc(${(RED_THRESHOLD / max) * 100}% - 1px)`,
                  right: "auto",
                  borderLeft: "2px dashed #DC2626",
                  opacity: 0.6,
                }}
                aria-hidden
              />
            </div>
            <span className={`w-6 text-right text-base ${red ? "font-bold text-alert" : ""}`}>
              {count}
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-slate-500">
        - - - ചുവപ്പ് പരിധി / red line = {RED_THRESHOLD} reports
      </p>
    </div>
  );
}
