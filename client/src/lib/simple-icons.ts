/**
 * Aegis Icons CDN utility for 2FAir
 * Provides mapping from provider names to Aegis Icons and CDN URLs
 * Using custom CDN: https://cdn.jsdelivr.net/gh/bug-breeder/aegis-icons@latest/SVG/
 */

// Provider name to Aegis Icons filename mapping - start with empty map
const PROVIDER_SLUG_MAP: Record<string, string> = {};

// Base CDN URL for Aegis Icons
const AEGIS_ICONS_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/bug-breeder/aegis-icons@latest/SVG";

/**
 * Get Aegis Icons filename for a provider name
 * @param providerName - The provider name (case insensitive)
 * @returns Aegis Icons filename or the normalized provider name
 */
export function getAegisIconsSlug(providerName: string): string {
  const normalizedName = providerName.toLowerCase().trim();

  // Return mapped filename if exists, otherwise use the normalized name directly
  return PROVIDER_SLUG_MAP[normalizedName] || normalizedName;
}

/**
 * Generate Aegis Icons CDN URL for a provider
 * @param providerName - The provider name
 * @param options - Configuration options
 * @returns CDN URL for the icon
 */
export function getAegisIconsCDNUrl(
  providerName: string,
  options: {
    fallbackIcon?: string;
  } = {},
): string {
  const { fallbackIcon = "generic" } = options;

  const slug = getAegisIconsSlug(providerName);

  return `${AEGIS_ICONS_CDN_BASE}/${slug}.svg`;
}

/**
 * Get a list of all supported provider names
 * @returns Array of supported provider names
 */
export function getSupportedProviders(): string[] {
  return Object.keys(PROVIDER_SLUG_MAP);
}

/**
 * Check if a provider is supported
 * @param providerName - The provider name to check
 * @returns True if supported, false otherwise
 */
export function isProviderSupported(providerName: string): boolean {
  const normalizedName = providerName.toLowerCase().trim();

  return PROVIDER_SLUG_MAP[normalizedName] !== undefined;
}

/**
 * React component props for Aegis Icons
 */
export interface AegisIconProps {
  provider: string;
  size?: number;
  className?: string;
  alt?: string;
  fallbackIcon?: string;
}

/**
 * Get props for an img element to display an Aegis Icon
 * @param props - Aegis icon props
 * @returns Props object for img element
 */
export function getAegisIconImgProps(props: AegisIconProps): {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
} {
  const { provider, size, className, alt, fallbackIcon } = props;

  return {
    src: getAegisIconsCDNUrl(provider, { fallbackIcon }),
    alt: alt || provider,
    width: size,
    height: size,
    className,
  };
}
