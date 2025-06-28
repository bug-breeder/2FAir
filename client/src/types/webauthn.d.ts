// WebAuthn PRF (Pseudo-Random Function) extension types
// These types are for advanced WebAuthn features that may not be fully typed in @types/webauthn-api

declare global {
  interface AuthenticationExtensionsClientInputs {
    prf?: {
      eval?: {
        first: string;
        second?: string;
      };
    };
  }

  interface AuthenticationExtensionsClientOutputs {
    prf?: {
      results?: {
        first?: ArrayBuffer;
        second?: ArrayBuffer;
      };
    };
  }
}

export {};
