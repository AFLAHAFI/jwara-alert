import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-primary text-white">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
        <Link href="/" className="mr-3 leading-tight">
          <span className="block whitespace-nowrap text-xl font-bold">ജ്വര അലർട്ട്</span>
          <span className="block text-xs text-teal-100">Jwara Alert</span>
        </Link>
        <nav className="flex gap-3 text-sm">
          <Link href="/report" className="rounded-lg px-2 py-1 hover:bg-primary-dark">
            റിപ്പോർട്ട്
          </Link>
          <Link href="/alerts" className="rounded-lg px-2 py-1 hover:bg-primary-dark">
            അറിയിപ്പുകൾ
          </Link>
        </nav>
      </div>
      <div className="bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">
        മാതൃകാ ഡാറ്റ മാത്രം · Example data only, no real cases
      </div>
    </header>
  );
}
