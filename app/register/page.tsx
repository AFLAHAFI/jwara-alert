import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        പൗരൻ രജിസ്ട്രേഷൻ
        <span className="label-en">Citizen sign-up</span>
      </h1>
      <RegisterForm mode="citizen" />
      <p className="text-center text-sm">
        <Link href="/login" className="underline">അക്കൗണ്ട് ഉണ്ടോ? ലോഗിൻ · Already have one? Log in</Link>
      </p>
    </div>
  );
}
