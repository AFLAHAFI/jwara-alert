import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export default function OfficerRegisterPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        പഞ്ചായത്ത് ഉദ്യോഗസ്ഥ രജിസ്ട്രേഷൻ
        <span className="label-en">Panchayat officer sign-up</span>
      </h1>
      <RegisterForm mode="officer" />
      <p className="text-center text-sm">
        <Link href="/login" className="underline">ലോഗിൻ · Log in</Link>
      </p>
    </div>
  );
}
