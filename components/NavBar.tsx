"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import type { NavItem } from "@/lib/nav";

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

/** Bottom tab bar on phones; inline menu in the header on tablets and laptops. */
export default function NavBar({ items, variant }: { items: NavItem[]; variant: "bottom" | "top" }) {
  const path = usePathname() ?? "/";
  const { t } = useI18n();

  if (variant === "top") {
    return (
      <nav aria-label={t.nav_main} className="hidden items-center gap-1 md:flex">
        {items.map((it) => {
          const active = isActive(path, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active ? "bg-white text-primary" : "text-teal-50 hover:bg-primary-dark"
              }`}
            >
              <Icon name={it.icon} className="h-4 w-4" />
              {t[it.label]}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label={t.nav_main}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((it) => {
          const active = isActive(path, it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 px-1 text-[13px] leading-tight ${
                  active ? "font-bold text-primary" : "text-slate-500"
                }`}
              >
                <span className={`rounded-full px-4 py-1 ${active ? "bg-teal-100" : ""}`}>
                  <Icon name={it.icon} className="h-5 w-5" />
                </span>
                <span className="max-w-full truncate">{t[it.label]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
