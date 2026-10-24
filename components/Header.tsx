import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser, ROLE_HOME, ROLE_LABEL } from "@/lib/authz";

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="bg-primary text-white">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="min-w-0 leading-tight">
          <span className="block whitespace-nowrap text-lg font-bold">ജ്വര അലർട്ട്</span>
          <span className="block text-xs text-teal-100">Jwara Alert</span>
        </Link>
        <nav className="flex shrink-0 gap-1 text-sm">
          <Link href="/report" className="whitespace-nowrap rounded-lg px-2 py-1 hover:bg-primary-dark">
            റിപ്പോർട്ട്
          </Link>
          <Link href="/alerts" className="whitespace-nowrap rounded-lg px-2 py-1 hover:bg-primary-dark">
            അറിയിപ്പുകൾ
          </Link>
        </nav>
      </div>
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 border-t border-white/20 px-4 py-1 text-xs">
        {user ? (
          <>
            <span className="min-w-0 truncate">
              {user.display_name} · {ROLE_LABEL[user.role].ml}
            </span>
            <span className="flex shrink-0 gap-3">
              <Link href={ROLE_HOME[user.role]} className="underline">ഹോം</Link>
              <LogoutButton className="underline" />
            </span>
          </>
        ) : (
          <>
            <Link href="/login" className="underline">ലോഗിൻ · Log in</Link>
            <Link href="/register" className="underline">രജിസ്റ്റർ · Register</Link>
          </>
        )}
      </div>
      <div className="bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">
        മാതൃകാ ഡാറ്റ മാത്രം · Example data only, no real cases
      </div>
    </header>
  );
}
