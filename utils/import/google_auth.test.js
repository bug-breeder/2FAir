const generateGoogleAuthenticatorBackupURL = require("./google_auth");

describe("generateGoogleAuthenticatorBackupURL", () => {
  it("should generate a valid Google Authenticator backup URL", async () => {
    const otps = [
      {
        issuer: "ExampleIssuer",
        label: "johndoe@example.com",
        secret: "THIl8+Jl6ugxr8x0X6eRMg==", // Base64 encoded secret
        algorithm: "SHA1",
        digits: 6,
        method: "TOTP",
        period: 30,
        counter: 0,
      },
    ];

    const url = await generateGoogleAuthenticatorBackupURL(otps);
    expect(url).toMatch(/^otpauth-migration:\/\/offline\?data=/);
  });

  it("should throw an error for invalid algorithm", async () => {
    const otps = [
      {
        issuer: "ExampleIssuer",
        label: "johndoe@example.com",
        secret: "THIl8+Jl6ugxr8x0X6eRMg==", // Base64 encoded secret
        algorithm: "INVALID_ALGO",
        digits: 6,
        method: "TOTP",
        period: 30,
        counter: 0,
      },
    ];

    await expect(generateGoogleAuthenticatorBackupURL(otps)).rejects.toThrow();
  });

  it("should throw an error for missing secret", async () => {
    const otps = [
      {
        issuer: "ExampleIssuer",
        label: "johndoe@example.com",
        secret: "", // Missing secret
        algorithm: "SHA1",
        digits: 6,
        method: "TOTP",
        period: 30,
        counter: 0,
      },
    ];

    await expect(generateGoogleAuthenticatorBackupURL(otps)).rejects.toThrow();
  });

  it("should throw an error for invalid method", async () => {
    const otps = [
      {
        issuer: "ExampleIssuer",
        label: "johndoe@example.com",
        secret: "THIl8+Jl6ugxr8x0X6eRMg==", // Base64 encoded secret
        algorithm: "SHA1",
        digits: 6,
        method: "INVALID_METHOD",
        period: 30,
        counter: 0,
      },
    ];

    await expect(generateGoogleAuthenticatorBackupURL(otps)).rejects.toThrow();
  });

  it("should handle multiple OTPs correctly", async () => {
    const otps = [
      {
        issuer: "ExampleIssuer1",
        label: "johndoe1@example.com",
        secret: "THIl8+Jl6ugxr8x0X6eRMg==", // Base64 encoded secret
        algorithm: "SHA1",
        digits: 6,
        method: "TOTP",
        period: 30,
        counter: 0,
      },
      {
        issuer: "ExampleIssuer2",
        label: "johndoe2@example.com",
        secret: "dGhpc2lzYW5vdGhlcmV4YW1wbGU=", // Base64 encoded secret
        algorithm: "SHA1",
        digits: 6,
        method: "HOTP",
        period: 0,
        counter: 1,
      },
    ];

    const url = await generateGoogleAuthenticatorBackupURL(otps);
    expect(url).toMatch(/^otpauth-migration:\/\/offline\?data=/);
  });
});
