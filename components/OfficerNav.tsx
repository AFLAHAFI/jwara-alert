import Link from "next/link";

const LINKS = [
  { href: "/home/officer", ml: "ഡാഷ്‌ബോർഡ്", en: "Dashboard" },
  { href: "/officer/alerts", ml: "അറിയിപ്പ്", en: "Alerts" },
  { href: "/officer/tasks", ml: "ജോലികൾ", en: "Tasks" },
  { href: "/officer/ashas", ml: "ആശ", en: "ASHAs" },
];

export default function OfficerNav({ active }: { active: string }) {
  return (
    <nav className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 shadow-sm" aria-label="Officer">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-xl px-1 py-2 text-center text-sm leading-tight ${
            active === l.href ? "bg-primary text-white" : "text-ink hover:bg-teal-50"
          }`}
        >
          {l.ml}
          <span className={`block text-xs ${active === l.href ? "text-teal-100" : "text-slate-500"}`}>{l.en}</span>
        </Link>
      ))}
    </nav>
  );
}
