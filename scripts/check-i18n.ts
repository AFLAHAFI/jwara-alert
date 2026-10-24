/**
 * Checks the three dictionaries: same keys, no empty text, and the same {placeholders}
 * in every language. TypeScript already enforces the keys; this also checks placeholders.
 *   npm run check:i18n
 */
import en from "../lib/i18n/en";
import ml from "../lib/i18n/ml";
import hi from "../lib/i18n/hi";

const dicts = { en, ml, hi } as Record<string, Record<string, string>>;
const keys = Object.keys(en);
const ph = (s: string) => Array.from(s.matchAll(/\{(\w+)\}/g), (m) => m[1]).sort().join(",");
let bad = 0;
for (const [lang, d] of Object.entries(dicts)) {
  const k = Object.keys(d);
  for (const key of keys) {
    if (!(key in d)) {
      console.error(`${lang}: missing ${key}`);
      bad++;
    } else if (!d[key].trim()) {
      console.error(`${lang}: empty ${key}`);
      bad++;
    } else if (ph(d[key]) !== ph(en[key as keyof typeof en])) {
      console.error(`${lang}: placeholders differ in ${key}: "${d[key]}"`);
      bad++;
    }
  }
  for (const key of k) if (!keys.includes(key)) (console.error(`${lang}: extra ${key}`), bad++);
}
if (bad) {
  console.error(`${bad} problem(s)`);
  process.exit(1);
}
console.log(`OK: ${keys.length} keys in ${Object.keys(dicts).length} languages`);
