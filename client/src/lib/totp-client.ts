import { generateTOTPCodes as generateTOTPCodesLib, TOTPConfig } from './totp';
import { decryptData } from './crypto';
import { getSessionEncryptionKey } from './webauthn';
import { OTP, OTPSecret } from '../types/otp';

/**
 * Generates TOTP codes client-side from encrypted secrets
 * This maintains zero-knowledge architecture by never sending secrets to server
 */
export async function generateClientTOTPCodes(otp: OTP): Promise<OTPSecret> {
  try {
    // Get session encryption key from WebAuthn
    const encryptionKey = await getSessionEncryptionKey();
    
    // Parse the encrypted secret (format: "ciphertext.iv.authTag")
    const [ciphertext, iv, authTag] = otp.Secret.split('.');
    if (!ciphertext || !iv || !authTag) {
      throw new Error('Invalid encrypted secret format');
    }
    
    // Decrypt the TOTP secret
    const decryptedSecret = await decryptData({
      ciphertext,
      iv,
      authTag
    }, encryptionKey);
    
    // Create TOTP config for the otpauth library
    const totpConfig: TOTPConfig = {
      secret: decryptedSecret,
      issuer: otp.Issuer,
      label: otp.Label,
      algorithm: 'SHA1', // Default algorithm
      digits: 6, // Default digits
      period: otp.Period
    };
    
    // Generate current and next TOTP codes using existing function
    const codes = generateTOTPCodesLib(totpConfig);
    
    return {
      Id: otp.Id,
      CurrentCode: codes.currentCode,
      CurrentExpireAt: codes.currentExpireAt.toISOString(),
      NextCode: codes.nextCode,
      NextExpireAt: codes.nextExpireAt.toISOString()
    };
    
  } catch (error) {
    console.error('Failed to generate TOTP codes:', error);
    throw new Error(`Failed to generate TOTP codes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates TOTP codes for multiple OTPs
 * Returns an array of OTPSecret objects
 */
export async function generateAllClientTOTPCodes(otps: OTP[]): Promise<OTPSecret[]> {
  const results: OTPSecret[] = [];
  
  // Generate codes for each OTP
  for (const otp of otps) {
    try {
      const codes = await generateClientTOTPCodes(otp);
      results.push(codes);
    } catch (error) {
      console.error(`Failed to generate codes for OTP ${otp.Id}:`, error);
      // Continue with other OTPs even if one fails
    }
  }
  
  return results;
} 