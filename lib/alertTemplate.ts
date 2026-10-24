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
