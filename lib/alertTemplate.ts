import type { Lang } from "@/lib/i18n";

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

// ------------------------------------------------------------------ Phase C/E
// Fixed precaution lists per illness group, in Malayalam, English and Hindi.
// No AI: the officer reads and edits the text before publishing.

type Group = "mosquito" | "water" | "lepto" | "airborne" | "nipah" | "general";

const GROUP_BY_SLUG: Record<string, Group> = {
  dengue: "mosquito",
  chikungunya: "mosquito",
  malaria: "mosquito",
  "hepatitis-a": "water",
  typhoid: "water",
  diarrhoea: "water",
  cholera: "water",
  leptospirosis: "lepto",
  chickenpox: "airborne",
  measles: "airborne",
  mumps: "airborne",
  h1n1: "airborne",
  respiratory: "airborne",
  nipah: "nipah",
};

const TIPS: Record<Lang, Record<Group | "always", string[]>> = {
  ml: {
    mosquito: [
      "വീടിനു ചുറ്റും കെട്ടിക്കിടക്കുന്ന വെള്ളം ഒഴിവാക്കുക (ചിരട്ട, ടയർ, പൂച്ചട്ടി).",
      "കൊതുകുവല ഉപയോഗിക്കുക; ശരീരം മുഴുവൻ മൂടുന്ന വസ്ത്രം ധരിക്കുക.",
      "ആഴ്ചയിൽ ഒരു ദിവസം ഡ്രൈ ഡേ ആചരിക്കുക.",
    ],
    water: [
      "കുടിവെള്ളം തിളപ്പിച്ച് ആറ്റി മാത്രം കുടിക്കുക.",
      "ഭക്ഷണത്തിന് മുമ്പും ശൗചാലയം ഉപയോഗിച്ച ശേഷവും സോപ്പിട്ട് കൈ കഴുകുക.",
      "തുറന്നുവെച്ച ഭക്ഷണം കഴിക്കരുത്.",
      "വയറിളക്കം ഉണ്ടെങ്കിൽ ഒ.ആർ.എസ് ലായനി കുടിക്കുക.",
    ],
    lepto: [
      "മലിനജലത്തിലും ചെളിയിലും ഇറങ്ങുമ്പോൾ കയ്യുറയും ബൂട്ടും ധരിക്കുക.",
      "ഇത്തരം ജോലി ചെയ്യുന്നവർ ഡോക്ടറുടെ നിർദേശപ്രകാരം പ്രതിരോധ ഗുളിക കഴിക്കുക.",
      "എലികളെ നിയന്ത്രിക്കുക; ഭക്ഷണാവശിഷ്ടങ്ങൾ മൂടിവെക്കുക.",
    ],
    airborne: [
      "ചുമയ്ക്കുമ്പോഴും തുമ്മുമ്പോഴും വായും മൂക്കും മൂടുക; മാസ്ക് ധരിക്കുക.",
      "രോഗമുള്ളവർ വീട്ടിൽ വിശ്രമിക്കുക; സ്കൂളിലും ജോലിക്കും പോകരുത്.",
      "കുട്ടികളുടെ പ്രതിരോധ കുത്തിവെപ്പുകൾ കൃത്യമായി എടുക്കുക.",
    ],
    nipah: [
      "വവ്വാലുകൾ കടിച്ചതോ നിലത്ത് വീണതോ ആയ പഴങ്ങൾ കഴിക്കരുത്.",
      "രോഗികളുമായി നേരിട്ടുള്ള സമ്പർക്കം ഒഴിവാക്കുക; മാസ്ക് ധരിക്കുക.",
      "ആരോഗ്യ വകുപ്പിന്റെ നിർദേശങ്ങൾ മാത്രം പിന്തുടരുക; അഭ്യൂഹങ്ങൾ പ്രചരിപ്പിക്കരുത്.",
    ],
    general: ["കുടിവെള്ളം തിളപ്പിച്ച് ആറ്റി മാത്രം കുടിക്കുക.", "വീടും പരിസരവും വൃത്തിയായി സൂക്ഷിക്കുക."],
    always: [
      "പനി 2 ദിവസത്തിൽ കൂടുതൽ നീണ്ടാൽ ഉടൻ അടുത്തുള്ള ആരോഗ്യ കേന്ദ്രത്തിൽ ഡോക്ടറെ കാണുക.",
      "സ്വയം ചികിത്സ ചെയ്യരുത്.",
      "അടിയന്തര ഘട്ടത്തിൽ 108 അല്ലെങ്കിൽ 112 എന്ന നമ്പറിൽ വിളിക്കുക.",
    ],
  },
  en: {
    mosquito: [
      "Remove standing water around your home (coconut shells, tyres, flower pots).",
      "Use mosquito nets and wear clothes that cover arms and legs.",
      "Keep one dry day every week.",
    ],
    water: [
      "Drink only water that has been boiled and cooled.",
      "Wash hands with soap before eating and after using the toilet.",
      "Do not eat food that was left uncovered.",
      "If you have diarrhoea, drink ORS solution.",
    ],
    lepto: [
      "Wear gloves and boots when working in dirty water or mud.",
      "People doing such work should take preventive tablets as advised by a doctor.",
      "Control rats and keep food waste covered.",
    ],
    airborne: [
      "Cover your mouth and nose when you cough or sneeze; wear a mask.",
      "Sick people should rest at home and not go to school or work.",
      "Make sure children get their vaccines on time.",
    ],
    nipah: [
      "Do not eat fruits bitten by bats or found fallen on the ground.",
      "Avoid direct contact with sick people; wear a mask.",
      "Follow only Health Department advice; do not spread rumours.",
    ],
    general: ["Drink only water that has been boiled and cooled.", "Keep your home and surroundings clean."],
    always: [
      "If fever lasts more than 2 days, see a doctor at the nearest health centre at once.",
      "Do not take medicine on your own.",
      "In an emergency, call 108 or 112.",
    ],
  },
  hi: {
    mosquito: [
      "घर के आसपास जमा पानी हटाएं (नारियल के खोल, टायर, गमले)।",
      "मच्छरदानी का उपयोग करें और पूरे शरीर को ढकने वाले कपड़े पहनें।",
      "हर हफ्ते एक दिन ड्राई डे रखें।",
    ],
    water: [
      "केवल उबालकर ठंडा किया हुआ पानी पिएं।",
      "खाने से पहले और शौचालय के बाद साबुन से हाथ धोएं।",
      "खुला रखा हुआ खाना न खाएं।",
      "दस्त होने पर ओआरएस घोल पिएं।",
    ],
    lepto: [
      "गंदे पानी या कीचड़ में काम करते समय दस्ताने और जूते पहनें।",
      "ऐसा काम करने वाले लोग डॉक्टर की सलाह से बचाव की गोली लें।",
      "चूहों पर नियंत्रण रखें और खाने का कचरा ढककर रखें।",
    ],
    airborne: [
      "खांसते या छींकते समय मुंह और नाक ढकें; मास्क पहनें।",
      "बीमार व्यक्ति घर पर आराम करें; स्कूल या काम पर न जाएं।",
      "बच्चों के टीके समय पर लगवाएं।",
    ],
    nipah: [
      "चमगादड़ के काटे हुए या जमीन पर गिरे फल न खाएं।",
      "बीमार लोगों से सीधे संपर्क से बचें; मास्क पहनें।",
      "केवल स्वास्थ्य विभाग की सलाह मानें; अफवाहें न फैलाएं।",
    ],
    general: ["केवल उबालकर ठंडा किया हुआ पानी पिएं।", "घर और आसपास की जगह साफ रखें।"],
    always: [
      "बुखार 2 दिन से ज्यादा रहे तो तुरंत नजदीकी स्वास्थ्य केंद्र में डॉक्टर को दिखाएं।",
      "खुद से दवा न लें।",
      "आपात स्थिति में 108 या 112 पर कॉल करें।",
    ],
  },
};

const TEXT: Record<Lang, { title: string; body: string; allWards: string; ward: string; footer: string; demo: string }> = {
  ml: {
    title: "⚠️ {illness} – ജാഗ്രതാ അറിയിപ്പ്",
    body: "നമ്മുടെ പ്രദേശത്ത് കഴിഞ്ഞ ദിവസങ്ങളിൽ {illness} സംശയിക്കുന്ന കേസുകൾ കൂടുതലായി റിപ്പോർട്ട് ചെയ്യപ്പെട്ടിട്ടുണ്ട്. ദയവായി താഴെ പറയുന്ന മുൻകരുതലുകൾ പാലിക്കുക:",
    allWards: "എല്ലാ വാർഡുകളും",
    ward: "വാർഡ് {list}",
    footer: "— {panchayat} ആരോഗ്യ വിഭാഗം",
    demo: "ഇത് മാതൃകാ അറിയിപ്പാണ്.",
  },
  en: {
    title: "⚠️ {illness}: health alert",
    body: "More suspected {illness} cases have been reported in our area in the last few days. Please follow these precautions:",
    allWards: "All wards",
    ward: "Ward {list}",
    footer: "— Health Section, {panchayat}",
    demo: "This is a demo alert.",
  },
  hi: {
    title: "⚠️ {illness}: स्वास्थ्य चेतावनी",
    body: "पिछले कुछ दिनों में हमारे क्षेत्र में {illness} के संदिग्ध मामले ज्यादा दर्ज हुए हैं। कृपया ये सावधानियां बरतें:",
    allWards: "सभी वार्ड",
    ward: "वार्ड {list}",
    footer: "— स्वास्थ्य विभाग, {panchayat}",
    demo: "यह एक डेमो चेतावनी है।",
  },
};

function fill(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

/** Alert text for an illness in a panchayat (all wards, or the listed wards), in one language. */
export function buildDiseaseAlertBody(opts: {
  lang: Lang;
  diseaseSlug: string;
  diseaseName: string;
  panchayatName: string;
  wardNumbers: number[];
}): string {
  const tx = TEXT[opts.lang];
  const tips = TIPS[opts.lang];
  const list = [...(tips[GROUP_BY_SLUG[opts.diseaseSlug] ?? "general"] ?? tips.general), ...tips.always];
  const wards = opts.wardNumbers.length
    ? fill(tx.ward, { list: [...opts.wardNumbers].sort((a, b) => a - b).join(", ") })
    : tx.allWards;
  return [
    fill(tx.title, { illness: opts.diseaseName }),
    `${opts.panchayatName} · ${wards}`,
    "",
    fill(tx.body, { illness: opts.diseaseName }),
    "",
    ...list.map((t, i) => `${i + 1}. ${t}`),
    "",
    fill(tx.footer, { panchayat: opts.panchayatName }),
    "",
    tx.demo,
  ].join("\n");
}
