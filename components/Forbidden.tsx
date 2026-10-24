import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="card space-y-3 text-center">
      <h1 className="text-xl font-bold">
        ഈ പേജ് കാണാൻ അനുമതിയില്ല
        <span className="label-en">You do not have access to this page.</span>
      </h1>
      <Link href="/home" className="btn-primary">
        എന്റെ ഹോമിലേക്ക് · Go to my home
      </Link>
    </div>
  );
}
