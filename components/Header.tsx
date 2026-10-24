import Link from "next/link";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";
import NavBar from "@/components/NavBar";
import type { Profile } from "@/lib/authz";
import type { Dict } from "@/lib/i18n";
import type { NavItem } from "@/lib/nav";

export default function Header({ user, t, nav, homeHref }: { user: Profile | null; t: Dict; nav: NavItem[]; homeHref: string }) {
  return (
    <header className="sticky top-0 z-30 bg-primary text-white shadow-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-2">
        <Link href={homeHref} className="flex min-w-0 items-center gap-2" aria-label={t.appName}>
          <span className="rounded-xl bg-white p-1">
            <Logo className="h-8 w-8" />
          </span>
          <span className="truncate text-lg font-bold leading-tight">{t.appName}</span>
        </Link>
        <NavBar items={nav} variant="top" />
        <LanguageSwitcher />
      </div>
      {user && (
        <div className="border-t border-white/15">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-1.5 text-sm">
            <span className="min-w-0 truncate">
              {user.display_name} · <span className="text-teal-100">{t[`role_${user.role}`]}</span>
            </span>
            <LogoutButton className="shrink-0 rounded-lg px-2 py-1 font-semibold hover:bg-primary-dark" />
          </div>
        </div>
      )}
      <div className="bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">{t.exampleData}</div>
    </header>
  );
}
