import type { Role } from "@/lib/authz";
import type { DictKey } from "@/lib/i18n";
import type { IconName } from "@/components/Icon";

export type NavItem = { href: string; label: DictKey; icon: IconName };

/** Menu for each role (and for visitors who are not logged in). */
export function navFor(role: Role | null): NavItem[] {
  switch (role) {
    case "citizen":
      return [
        { href: "/home/citizen", label: "nav_home", icon: "home" },
        { href: "/report", label: "nav_report", icon: "report" },
        { href: "/alerts", label: "nav_alerts", icon: "bell" },
      ];
    case "panchayat_officer":
      return [
        { href: "/home/officer", label: "nav_dashboard", icon: "chart" },
        { href: "/officer/alerts", label: "nav_alerts", icon: "bell" },
        { href: "/officer/tasks", label: "nav_tasks", icon: "tasks" },
        { href: "/officer/ashas", label: "nav_ashas", icon: "users" },
      ];
    case "asha":
      return [
        { href: "/home/asha", label: "nav_tasks", icon: "tasks" },
        { href: "/alerts", label: "nav_alerts", icon: "bell" },
      ];
    case "state_admin":
      return [
        { href: "/home/admin", label: "nav_dashboard", icon: "chart" },
        { href: "/admin/officers", label: "nav_officers", icon: "shield" },
      ];
    default:
      return [
        { href: "/", label: "nav_home", icon: "home" },
        { href: "/report", label: "nav_report", icon: "report" },
        { href: "/alerts", label: "nav_alerts", icon: "bell" },
        { href: "/login", label: "nav_login", icon: "login" },
      ];
  }
}
