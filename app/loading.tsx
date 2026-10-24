export default function Loading() {
  return (
    <div className="narrow space-y-4" aria-busy="true">
      <div className="skeleton h-9 w-2/3" />
      <div className="skeleton h-28" />
      <div className="skeleton h-14" />
      <div className="skeleton h-14" />
    </div>
  );
}
