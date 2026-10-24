/** Fixed Malayalam alert template. No AI, no runtime generation; admin edits before publishing. */
export function buildAlertBody(ward: number): string {
  return [
    `⚠️ പനി ജാഗ്രതാ അറിയിപ്പ് – വാർഡ് ${ward}`,
    "",
    `വാർഡ് ${ward}-ൽ കഴിഞ്ഞ ദിവസങ്ങളിൽ പനി കേസുകൾ കൂടുതലായി റിപ്പോർട്ട് ചെയ്യപ്പെട്ടിട്ടുണ്ട്. ദയവായി താഴെ പറയുന്ന മുൻകരുതലുകൾ പാലിക്കുക:`,
    "",
    "1. കുടിവെള്ളം തിളപ്പിച്ച് ആറ്റി മാത്രം കുടിക്കുക.",
    "2. വീടിനു ചുറ്റും കെട്ടിക്കിടക്കുന്ന വെള്ളം നീക്കം ചെയ്യുക.",
    "3. പനി 2 ദിവസത്തിൽ കൂടുതൽ നീണ്ടുനിന്നാൽ ഉടൻ ഡോക്ടറെ കാണുക.",
    "4. സ്വയം ചികിത്സ ചെയ്യരുത്.",
    "5. അടിയന്തര ഘട്ടത്തിൽ 108 അല്ലെങ്കിൽ 112 എന്ന നമ്പറിൽ വിളിക്കുക.",
    "",
    "— പഞ്ചായത്ത് ആരോഗ്യ വിഭാഗം",
    "",
    "ഇത് മാതൃകാ അറിയിപ്പാണ്.",
  ].join("\n");
}

export function taskTitleForWard(ward: number): string {
  return `Visit Ward ${ward} houses`;
}

/** Upper bound for an edited alert body (characters). */
export const MAX_ALERT_BODY = 4000;

// ------------------------------------------------------------------ Phase C
// Fixed precaution lists per disease group. No AI: the officer edits before publishing.
const MOSQUITO = [
  "വീടിനു ചുറ്റും കെട്ടിക്കിടക്കുന്ന വെള്ളം ഒഴിവാക്കുക (ചിരട്ട, ടയർ, പൂച്ചട്ടി).",
  "കൊതുകുവല ഉപയോഗിക്കുക; ശരീരം മുഴുവൻ മൂടുന്ന വസ്ത്രം ധരിക്കുക.",
  "ആഴ്ചയിൽ ഒരു ദിവസം ഡ്രൈ ഡേ ആചരിക്കുക.",
];
const WATER = [
  "കുടിവെള്ളം തിളപ്പിച്ച് ആറ്റി മാത്രം കുടിക്കുക.",
  "ഭക്ഷണത്തിന് മുമ്പും ശൗചാലയം ഉപയോഗിച്ച ശേഷവും സോപ്പിട്ട് കൈ കഴുകുക.",
  "തുറന്നുവെച്ച ഭക്ഷണം കഴിക്കരുത്.",
  "വയറിളക്കം ഉണ്ടെങ്കിൽ ഒ.ആർ.എസ് ലായനി കുടിക്കുക.",
];
const LEPTO = [
  "മലിനജലത്തിലും ചെളിയിലും ഇറങ്ങുമ്പോൾ കയ്യുറയും ബൂട്ടും ധരിക്കുക.",
  "ഇത്തരം ജോലി ചെയ്യുന്നവർ ഡോക്ടറുടെ നിർദേശപ്രകാരം പ്രതിരോധ ഗുളിക കഴിക്കുക.",
  "എലികളെ നിയന്ത്രിക്കുക; ഭക്ഷണാവശിഷ്ടങ്ങൾ മൂടിവെക്കുക.",
];
const AIRBORNE = [
  "ചുമയ്ക്കുമ്പോഴും തുമ്മുമ്പോഴും വായും മൂക്കും മൂടുക; മാസ്ക് ധരിക്കുക.",
  "രോഗമുള്ളവർ വീട്ടിൽ വിശ്രമിക്കുക; സ്കൂളിലും ജോലിക്കും പോകരുത്.",
  "കുട്ടികളുടെ പ്രതിരോധ കുത്തിവെപ്പുകൾ കൃത്യമായി എടുക്കുക.",
];
const NIPAH = [
  "വവ്വാലുകൾ കടിച്ചതോ നിലത്ത് വീണതോ ആയ പഴങ്ങൾ കഴിക്കരുത്.",
  "രോഗികളുമായി നേരിട്ടുള്ള സമ്പർക്കം ഒഴിവാക്കുക; മാസ്ക് ധരിക്കുക.",
  "ആരോഗ്യ വകുപ്പിന്റെ നിർദേശങ്ങൾ മാത്രം പിന്തുടരുക; അഭ്യൂഹങ്ങൾ പ്രചരിപ്പിക്കരുത്.",
];
const GENERAL = [
  "കുടിവെള്ളം തിളപ്പിച്ച് ആറ്റി മാത്രം കുടിക്കുക.",
  "വീടും പരിസരവും വൃത്തിയായി സൂക്ഷിക്കുക.",
];
const TIPS_BY_SLUG: Record<string, string[]> = {
  dengue: MOSQUITO,
  chikungunya: MOSQUITO,
  malaria: MOSQUITO,
  "hepatitis-a": WATER,
  typhoid: WATER,
  diarrhoea: WATER,
  cholera: WATER,
  leptospirosis: LEPTO,
  chickenpox: AIRBORNE,
  measles: AIRBORNE,
  mumps: AIRBORNE,
  h1n1: AIRBORNE,
  respiratory: AIRBORNE,
  nipah: NIPAH,
};
const ALWAYS = [
  "പനി 2 ദിവസത്തിൽ കൂടുതൽ നീണ്ടാൽ ഉടൻ അടുത്തുള്ള ആരോഗ്യ കേന്ദ്രത്തിൽ ഡോക്ടറെ കാണുക.",
  "സ്വയം ചികിത്സ ചെയ്യരുത്.",
  "അടിയന്തര ഘട്ടത്തിൽ 108 അല്ലെങ്കിൽ 112 എന്ന നമ്പറിൽ വിളിക്കുക.",
];

export function wardsLabelMl(wardNumbers: number[]): string {
  if (wardNumbers.length === 0) return "എല്ലാ വാർഡുകളും";
  return `വാർഡ് ${[...wardNumbers].sort((a, b) => a - b).join(", ")}`;
}

/** Malayalam alert text for a disease in a panchayat (all wards, or the listed wards). */
export function buildDiseaseAlertBody(opts: {
  diseaseSlug: string;
  diseaseMl: string;
  panchayatMl: string;
  wardNumbers: number[];
}): string {
  const tips = [...(TIPS_BY_SLUG[opts.diseaseSlug] ?? GENERAL), ...ALWAYS];
  return [
    `⚠️ ${opts.diseaseMl} – ജാഗ്രതാ അറിയിപ്പ്`,
    `${opts.panchayatMl} · ${wardsLabelMl(opts.wardNumbers)}`,
    "",
    `നമ്മുടെ പ്രദേശത്ത് കഴിഞ്ഞ ദിവസങ്ങളിൽ ${opts.diseaseMl} സംശയിക്കുന്ന കേസുകൾ കൂടുതലായി റിപ്പോർട്ട് ചെയ്യപ്പെട്ടിട്ടുണ്ട്. ദയവായി താഴെ പറയുന്ന മുൻകരുതലുകൾ പാലിക്കുക:`,
    "",
    ...tips.map((t, i) => `${i + 1}. ${t}`),
    "",
    `— ${opts.panchayatMl} ആരോഗ്യ വിഭാഗം`,
    "",
    "ഇത് മാതൃകാ അറിയിപ്പാണ്.",
  ].join("\n");
}

export function taskTitleFor(wardNumber: number, diseaseEn: string): string {
  return `Visit homes in Ward ${wardNumber} (${diseaseEn})`;
}
