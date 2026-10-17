/**
 * Service logos from the Aegis icon pack, served by jsDelivr.
 * Cached by the service worker after first use; the UI falls back to initials.
 */

const AEGIS_ICONS_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/bug-breeder/aegis-icons@latest/SVG";

export function getServiceIconUrl(issuer: string): string {
  return `${AEGIS_ICONS_CDN_BASE}/${encodeURIComponent(issuer.toLowerCase().trim())}.svg`;
}
