import { Entry } from "./vault/types";

/** Every whitespace-separated term must appear in the issuer or label. */
export function searchEntries(entries: Entry[], query: string): Entry[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (terms.length === 0) return entries;

  return entries.filter((entry) => {
    const haystack = `${entry.issuer} ${entry.label}`.toLowerCase();

    return terms.every((term) => haystack.includes(term));
  });
}
