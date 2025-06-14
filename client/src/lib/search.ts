import { OTP, OTPSecret } from "../types/otp";

export interface SearchableOTPItem {
  otp: OTP;
  secret: OTPSecret;
}

/**
 * Searches through OTP items based on issuer and label
 * @param items - Array of OTP items to search through
 * @param query - Search query string
 * @returns Filtered array of OTP items matching the search query
 */
export function searchOTPs(
  items: SearchableOTPItem[],
  query: string
): SearchableOTPItem[] {
  if (!query.trim()) {
    return items;
  }

  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0);

  return items.filter((item) => {
    const issuer = item.otp.Issuer?.toLowerCase() || "";
    const label = item.otp.Label?.toLowerCase() || "";
    const searchableText = `${issuer} ${label}`;

    // Check if all search terms are found in the searchable text
    return searchTerms.every(term =>
      searchableText.includes(term) ||
      issuer.includes(term) ||
      label.includes(term)
    );
  });
}

/**
 * Highlights search terms in text
 * @param text - Text to highlight
 * @param query - Search query to highlight
 * @returns Text with highlighted search terms
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0);

  let highlightedText = text;

  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-700 px-1 rounded">$1</mark>'
    );
  });

  return highlightedText;
}

/**
 * Gets search statistics
 * @param totalItems - Total number of items
 * @param filteredItems - Number of filtered items
 * @param query - Search query
 * @returns Search statistics object
 */
export function getSearchStats(
  totalItems: number,
  filteredItems: number,
  query: string
) {
  const isSearchActive = query.trim().length > 0;
  const hasResults = filteredItems > 0;
  const showingAll = filteredItems === totalItems;

  return {
    isSearchActive,
    hasResults,
    showingAll,
    totalItems,
    filteredItems,
    query: query.trim(),
  };
} 