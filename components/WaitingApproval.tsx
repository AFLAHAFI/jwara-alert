export default function WaitingApproval() {
  return (
    <div className="card space-y-2">
      <h1 className="text-xl font-bold">
        അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു
        <span className="label-en">Waiting for approval</span>
      </h1>
      <p className="text-slate-600">
        സംസ്ഥാന ആരോഗ്യ വകുപ്പ് നിങ്ങളുടെ അക്കൗണ്ട് അംഗീകരിച്ച ശേഷം ഇവിടെ പ്രവേശിക്കാം.
        <span className="label-en">
          You can use this page once the state health department approves your account.
        </span>
      </p>
    </div>
  );
}
