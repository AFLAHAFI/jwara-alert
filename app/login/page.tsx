import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser, ROLE_HOME } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        ലോഗിൻ
        <span className="label-en">Log in</span>
      </h1>
      <LoginForm />
      <p className="text-center text-sm">
        <Link href="/register" className="underline">പുതിയ അക്കൗണ്ട് · New citizen account</Link>
        {" · "}
        <Link href="/officer/register" className="underline">ഉദ്യോഗസ്ഥ രജിസ്ട്രേഷൻ · Officer sign-up</Link>
      </p>
    </div>
  );
}
