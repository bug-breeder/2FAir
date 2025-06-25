import { TOTP, Secret } from 'otpauth';

export interface TOTPConfig {
  secret: string;
  issuer?: string;
  label?: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number;
  period?: number;
}

export interface TOTPCodes {
  currentCode: string;
  nextCode: string;
  currentExpireAt: Date;
  nextExpireAt: Date;
}

/**
 * Generates a TOTP code from the given configuration
 */
export function generateTOTPCode(config: TOTPConfig): string {
  const totp = new TOTP({
    issuer: config.issuer || 'Unknown',
    label: config.label || 'Unknown',
    algorithm: config.algorithm || 'SHA1',
    digits: config.digits || 6,
    period: config.period || 30,
    secret: config.secret,
  });

  return totp.generate();
}

/**
 * Generates both current and next TOTP codes with expiration times
 */
export function generateTOTPCodes(config: TOTPConfig): TOTPCodes {
  const totp = new TOTP({
    issuer: config.issuer || 'Unknown',
    label: config.label || 'Unknown',
    algorithm: config.algorithm || 'SHA1',
    digits: config.digits || 6,
    period: config.period || 30,
    secret: config.secret,
  });

  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const period = config.period || 30;
  
  // Calculate current period start and end
  const currentPeriodStart = Math.floor(nowSeconds / period) * period;
  const currentPeriodEnd = currentPeriodStart + period;
  
  // Calculate next period end
  const nextPeriodEnd = currentPeriodEnd + period;
  
  // Generate current code
  const currentCode = totp.generate();
  
  // Generate next code by using the next period timestamp
  const nextCode = totp.generate({ timestamp: currentPeriodEnd * 1000 });
  
  return {
    currentCode,
    nextCode,
    currentExpireAt: new Date(currentPeriodEnd * 1000),
    nextExpireAt: new Date(nextPeriodEnd * 1000),
  };
}

/**
 * Gets the remaining time until the current TOTP code expires
 */
export function getTOTPRemainingTime(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000);
  const remaining = period - (now % period);
  return remaining;
}

/**
 * Validates a TOTP secret string
 */
export function validateTOTPSecret(secret: string): boolean {
  try {
    // Try to create a TOTP instance with the secret
    new TOTP({ secret });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a random TOTP secret
 */
export function generateTOTPSecret(): string {
  const secret = new Secret({ size: 20 }); // 160 bits
  return secret.base32;
}

/**
 * Creates a QR code URI for TOTP setup
 */
export function createTOTPUri(config: TOTPConfig): string {
  const totp = new TOTP({
    issuer: config.issuer || 'Unknown',
    label: config.label || 'Unknown',
    algorithm: config.algorithm || 'SHA1',
    digits: config.digits || 6,
    period: config.period || 30,
    secret: config.secret,
  });

  return totp.toString();
}

/**
 * Normalizes a TOTP secret to proper Base32 format
 */
export function normalizeTOTPSecret(secret: string): string {
  return secret.toUpperCase().replace(/[\s\-_]/g, '');
}

/**
 * Parses an otpauth:// URI to extract TOTP configuration
 */
export function parseOTPAuthURI(uri: string): TOTPConfig | null {
  try {
    if (!uri.startsWith('otpauth://totp/')) {
      return null;
    }

    const url = new URL(uri);
    const pathParts = url.pathname.split(':');
    const label = pathParts.length > 1 ? pathParts[1] : pathParts[0].substring(1);
    
    const secret = url.searchParams.get('secret');
    if (!secret) return null;

    return {
      secret: normalizeTOTPSecret(secret),
      issuer: url.searchParams.get('issuer') || undefined,
      label: label || undefined,
      algorithm: (url.searchParams.get('algorithm') as 'SHA1' | 'SHA256' | 'SHA512') || 'SHA1',
      digits: parseInt(url.searchParams.get('digits') || '6'),
      period: parseInt(url.searchParams.get('period') || '30'),
    };
  } catch (error) {
    console.error('Error parsing OTPAuth URI:', error);
    return null;
  }
}

/**
 * Generates an otpauth:// URI from TOTP configuration
 */
export function generateOTPAuthURI(config: TOTPConfig): string {
  const issuer = encodeURIComponent(config.issuer || 'Unknown');
  const label = encodeURIComponent(config.label || 'Unknown');
  const secret = config.secret;
  const algorithm = config.algorithm || 'SHA1';
  const digits = config.digits || 6;
  const period = config.period || 30;

  return `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
} 