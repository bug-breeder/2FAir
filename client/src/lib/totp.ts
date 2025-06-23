import { TOTP } from 'otpauth';

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
  currentExpireAt: Date;
  nextCode: string;
  nextExpireAt: Date;
  timeRemaining: number; // seconds until current code expires
}

/**
 * Generates TOTP codes for a given secret
 * This replaces the removed server-side /api/v1/otp/codes endpoint
 */
export function generateTOTPCodes(config: TOTPConfig): TOTPCodes {
  const totp = new TOTP({
    issuer: config.issuer || 'Unknown',
    label: config.label || 'Unknown',
    algorithm: config.algorithm || 'SHA1',
    digits: config.digits || 6,
    period: config.period || 30,
    secret: config.secret, // Base32 encoded secret
  });

  const now = Date.now();
  const period = (config.period || 30) * 1000; // Convert to milliseconds
  
  // Calculate current period start time
  const currentPeriodStart = Math.floor(now / period) * period;
  const nextPeriodStart = currentPeriodStart + period;
  
  // Generate current and next codes
  const currentCode = totp.generate({ timestamp: currentPeriodStart });
  const nextCode = totp.generate({ timestamp: nextPeriodStart });
  
  // Calculate expiration times
  const currentExpireAt = new Date(nextPeriodStart);
  const nextExpireAt = new Date(nextPeriodStart + period);
  
  // Calculate time remaining for current code
  const timeRemaining = Math.ceil((nextPeriodStart - now) / 1000);

  return {
    currentCode,
    currentExpireAt,
    nextCode,
    nextExpireAt,
    timeRemaining,
  };
}

/**
 * Validates a TOTP secret (Base32 format)
 */
export function validateTOTPSecret(secret: string): boolean {
  if (!secret) return false;
  
  // Remove spaces and common separators
  const normalized = secret.toUpperCase().replace(/[\s\-_]/g, '');
  
  // Check base32 format (A-Z, 2-7)
  if (!/^[A-Z2-7]+$/.test(normalized)) {
    return false;
  }
  
  // Check reasonable length
  if (normalized.length < 16 || normalized.length > 128) {
    return false;
  }
  
  return true;
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