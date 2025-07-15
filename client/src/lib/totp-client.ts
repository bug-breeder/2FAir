import { OTP, OTPSecret } from "../types/otp";

import { generateTOTPCodes as generateTOTPCodesLib, TOTPConfig } from "./totp";
import { decryptData } from "./crypto";
import { getSessionEncryptionKey } from "./webauthn";

/**
 * Generates TOTP codes client-side from encrypted secrets
 * This maintains zero-knowledge architecture by never sending secrets to server
 */
export async function generateClientTOTPCodes(otp: OTP): Promise<OTPSecret> {
  try {
    // Get session encryption key from WebAuthn
    const encryptionKey = await getSessionEncryptionKey();

    // Parse the encrypted secret (format: "ciphertext.iv.authTag")
    const [ciphertext, iv, authTag] = otp.Secret.split(".");

    if (!ciphertext || !iv || !authTag) {
      throw new Error(`Invalid encrypted secret format for OTP ${otp.Label}`);
    }

    // Decrypt the TOTP secret
    const decryptedSecret = await decryptData(
      {
        ciphertext,
        iv,
        authTag,
      },
      encryptionKey,
    );

    // Create TOTP config for the otpauth library
    const totpConfig: TOTPConfig = {
      secret: decryptedSecret,
      issuer: otp.Issuer,
      label: otp.Label,
      algorithm: "SHA1", // Default algorithm
      digits: 6, // Default digits
      period: otp.Period,
    };

    // Generate current and next TOTP codes using existing function
    const codes = generateTOTPCodesLib(totpConfig);

    return {
      Id: otp.Id,
      CurrentCode: codes.currentCode,
      CurrentExpireAt: codes.currentExpireAt.toISOString(),
      NextCode: codes.nextCode,
      NextExpireAt: codes.nextExpireAt.toISOString(),
    };
  } catch (error) {
    // Note: Console logging removed for production use
    throw new Error(
      `Failed to generate TOTP codes for ${otp.Label}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generates TOTP codes for multiple OTPs with improved error handling
 * Returns an array of OTPSecret objects, skipping failed generations
 *
 * @param otps Array of OTP objects to generate codes for
 * @returns Promise resolving to array of successfully generated OTPSecret objects
 */
export async function generateAllClientTOTPCodes(
  otps: OTP[],
): Promise<OTPSecret[]> {
  if (!otps || !Array.isArray(otps) || otps.length === 0) {
    return [];
  }

  const results: OTPSecret[] = [];
  const errors: string[] = [];

  // Use Promise.allSettled for better error handling
  const settledPromises = await Promise.allSettled(
    otps.map(async (otp) => {
      try {
        return await generateClientTOTPCodes(otp);
      } catch (error) {
        errors.push(
          `${otp.Label}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw error;
      }
    }),
  );

  // Process results
  settledPromises.forEach((result, index) => {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      // Note: Console logging removed for production use
      // Error details are tracked in the errors array
    }
  });

  // Log summary if there were errors
  if (errors.length > 0) {
    // Note: Console logging removed for production use
    // Error information is available in the errors array for debugging
  }

  return results;
}
