/**
 * Passkey unlock via the WebAuthn PRF extension.
 *
 * There is no server: we never verify signatures. The authenticator's user
 * verification (Face ID, Touch ID, Windows Hello, security key PIN) gates
 * access to the PRF output, and the PRF output is what unwraps the vault key.
 */

import { fromBase64Url, randomBytes, toBase64Url } from "./crypto";

export class PasskeyError extends Error {
  constructor(
    public code: "unsupported" | "prf-unsupported" | "cancelled" | "failed",
    message?: string,
  ) {
    super(message ?? code);
  }
}

interface PrfValues {
  first: BufferSource;
}

interface PrfExtensionOutput {
  enabled?: boolean;
  results?: { first?: ArrayBuffer };
}

function prfOutputOf(
  credential: PublicKeyCredential,
): PrfExtensionOutput | undefined {
  return (
    credential.getClientExtensionResults() as { prf?: PrfExtensionOutput }
  ).prf;
}

function toPasskeyError(error: unknown): PasskeyError {
  if (error instanceof PasskeyError) return error;
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return new PasskeyError("cancelled", error.message);
  }

  return new PasskeyError(
    "failed",
    error instanceof Error ? error.message : String(error),
  );
}

export function isPasskeyAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

/**
 * Best-effort PRF capability check. Returns undefined when the browser can't
 * tell us; callers should then just try and handle "prf-unsupported".
 */
export async function isPrfLikelySupported(): Promise<boolean | undefined> {
  if (!isPasskeyAvailable()) return false;

  const getCaps = (
    PublicKeyCredential as unknown as {
      getClientCapabilities?: () => Promise<Record<string, boolean>>;
    }
  ).getClientCapabilities;

  if (!getCaps) return undefined;

  try {
    const caps = await getCaps.call(PublicKeyCredential);

    return caps["extension:prf"];
  } catch {
    return undefined;
  }
}

async function evaluatePrf(
  credentialIds: string[],
  prfSalt: Uint8Array,
): Promise<{ credentialId: string; prfOutput: Uint8Array }> {
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: credentialIds.map((id) => ({
        type: "public-key",
        id: fromBase64Url(id),
      })),
      userVerification: "required",
      timeout: 60_000,
      extensions: {
        prf: { eval: { first: prfSalt } as PrfValues },
      } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new PasskeyError("cancelled");

  const first = prfOutputOf(credential)?.results?.first;

  if (!first) throw new PasskeyError("prf-unsupported");

  return {
    credentialId: toBase64Url(credential.rawId),
    prfOutput: new Uint8Array(first),
  };
}

/** Creates a new passkey and returns its PRF output for the given salt. */
export async function createPasskey(
  prfSalt: Uint8Array,
  displayName: string,
): Promise<{ credentialId: string; prfOutput: Uint8Array }> {
  if (!isPasskeyAvailable()) throw new PasskeyError("unsupported");

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        rp: { name: "2FAir" },
        user: {
          id: randomBytes(16),
          name: displayName,
          displayName,
        },
        challenge: randomBytes(32),
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "required",
        },
        timeout: 60_000,
        extensions: {
          prf: { eval: { first: prfSalt } as PrfValues },
        } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential | null;

    if (!credential) throw new PasskeyError("cancelled");

    const credentialId = toBase64Url(credential.rawId);
    const prf = prfOutputOf(credential);

    if (prf?.results?.first) {
      return { credentialId, prfOutput: new Uint8Array(prf.results.first) };
    }

    // Some authenticators only report `enabled` at creation and return PRF
    // results on assertion, so ask once more.
    if (prf?.enabled) {
      return await evaluatePrf([credentialId], prfSalt);
    }

    throw new PasskeyError("prf-unsupported");
  } catch (error) {
    throw toPasskeyError(error);
  }
}

/** Prompts for any of the given passkeys and returns which one answered. */
export async function getPasskeyPrf(
  credentialIds: string[],
  prfSalt: Uint8Array,
): Promise<{ credentialId: string; prfOutput: Uint8Array }> {
  if (!isPasskeyAvailable()) throw new PasskeyError("unsupported");

  try {
    return await evaluatePrf(credentialIds, prfSalt);
  } catch (error) {
    throw toPasskeyError(error);
  }
}
