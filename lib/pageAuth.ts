import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type Profile, type Role } from "@/lib/authz";

/**
 * Page guard for server components. Redirects to /login without a session.
 * Returns null when logged in with the wrong role (render <Forbidden />).
 * Unapproved accounts are returned only when allowUnapproved is set.
 */
export async function guardPage(
  roles: Role[],
  opts: { allowUnapproved?: boolean } = {},
): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) return null;
  if (!user.approved && !opts.allowUnapproved) return null;
  return user;
}
