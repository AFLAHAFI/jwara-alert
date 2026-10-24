import { redirect } from "next/navigation";
import { getCurrentUser, ROLE_HOME } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function HomeRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(ROLE_HOME[user.role]);
}
