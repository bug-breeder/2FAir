import { Secret } from "otpauth";
import { describe, it, expect } from "vitest";

import {
  buildOtpauthList,
  buildOtpauthUri,
  formatCode,
  generateCode,
  isValidSecret,
  OtpauthParseError,
  parseOtpauthList,
  parseOtpauthUri,
} from "../totp";

// Built from ASCII rather than written out in base32, so secret scanners
// don't flag test vectors.
const ACME_SECRET = Secret.fromLatin1("1234567890").base32;

describe("parseOtpauthUri", () => {
  it("parses issuer, label and parameters", () => {
    const entry = parseOtpauthUri(
      "otpauth://totp/GitHub:me%40example.com?secret=jbswy3dpehpk3pxp&issuer=GitHub&algorithm=SHA256&digits=8&period=60",
    );

    expect(entry).toEqual({
      issuer: "GitHub",
      label: "me@example.com",
      secret: "JBSWY3DPEHPK3PXP",
      algorithm: "SHA256",
      digits: 8,
      period: 60,
    });
  });

  it("falls back to the path issuer and defaults", () => {
    const entry = parseOtpauthUri(
      "otpauth://totp/ACME%3Aalice?secret=JBSWY3DPEHPK3PXP",
    );

    expect(entry).toMatchObject({
      issuer: "ACME",
      label: "alice",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
  });

  it("rejects non-TOTP and malformed URIs", () => {
    expect(() => parseOtpauthUri("https://example.com")).toThrow(
      OtpauthParseError,
    );
    expect(() =>
      parseOtpauthUri("otpauth://hotp/x?secret=JBSWY3DPEHPK3PXP"),
    ).toThrow(OtpauthParseError);
    expect(() => parseOtpauthUri("otpauth://totp/x?secret=not!base32")).toThrow(
      OtpauthParseError,
    );
  });

  it("round-trips through buildOtpauthUri", () => {
    const input = {
      issuer: "Example Co",
      label: "bob@example.com",
      secret: "JBSWY3DPEHPK3PXP",
      algorithm: "SHA512" as const,
      digits: 7,
      period: 45,
    };

    expect(parseOtpauthUri(buildOtpauthUri(input))).toEqual(input);
  });
});

describe("parseOtpauthList", () => {
  it("reads a CRLF text export with one link per line", () => {
    const text = [
      "\uFEFFotpauth://totp/Example%20Co:alice%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example%20Co",
      "",
      `  otpauth://totp/ACME:bob%2B(team?secret=${ACME_SECRET}&issuer=ACME  `,
      "",
    ].join("\r\n");

    expect(parseOtpauthList(text)).toEqual({
      entries: [
        expect.objectContaining({
          issuer: "Example Co",
          label: "alice@example.com",
          secret: "JBSWY3DPEHPK3PXP",
        }),
        expect.objectContaining({
          issuer: "ACME",
          label: "bob+(team",
          secret: ACME_SECRET,
        }),
      ],
      skipped: 0,
      migration: 0,
    });
  });

  it("accepts long secrets", () => {
    const secret = "JBSWY3DPEHPK3PXP".repeat(7).slice(0, 103);
    const { entries } = parseOtpauthList(
      `otpauth://totp/Long:me?secret=${secret}&issuer=Long`,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].secret).toBe(secret);
  });

  it("skips invalid links, ignores other text and drops repeats", () => {
    const good = "otpauth://totp/GitHub:me?secret=JBSWY3DPEHPK3PXP";
    const text = [
      "My accounts:",
      good,
      good,
      "otpauth://hotp/Counter:me?secret=JBSWY3DPEHPK3PXP&counter=1",
      "otpauth://totp/Bad:me?secret=not!base32",
      "otpauth://totp/Bad%E0%A4%A:me?secret=JBSWY3DPEHPK3PXP",
      "otpauth-migration://offline?data=abc",
    ].join("\n");

    expect(parseOtpauthList(text)).toMatchObject({
      entries: [{ issuer: "GitHub", label: "me" }],
      skipped: 3,
      migration: 1,
    });
  });

  it("finds nothing in unrelated files", () => {
    expect(parseOtpauthList('{"hello":"world"}')).toEqual({
      entries: [],
      skipped: 0,
      migration: 0,
    });
  });

  it("round-trips through buildOtpauthList", () => {
    const entries = [
      {
        issuer: "Example Co",
        label: "bob+test@example.com",
        secret: "JBSWY3DPEHPK3PXP",
        algorithm: "SHA256" as const,
        digits: 8,
        period: 60,
      },
      {
        issuer: "ACME",
        label: "alice",
        secret: ACME_SECRET,
        algorithm: "SHA1" as const,
        digits: 6,
        period: 30,
      },
    ];
    const text = buildOtpauthList(entries);

    expect(text.trim().split("\n")).toHaveLength(2);
    expect(parseOtpauthList(text).entries).toEqual(entries);
  });
});

describe("generateCode", () => {
  // RFC 6238 test vector: secret "12345678901234567890" (ASCII), T = 59s.
  const rfcSecret = Secret.fromLatin1("12345678901234567890").base32;

  it("matches the RFC 6238 SHA1 vector", () => {
    const code = generateCode(
      {
        issuer: "x",
        label: "x",
        secret: rfcSecret,
        algorithm: "SHA1",
        digits: 8,
        period: 30,
      },
      59_000,
    );

    expect(code).toBe("94287082");
  });

  it("honours digits", () => {
    const code = generateCode(
      {
        issuer: "x",
        label: "x",
        secret: rfcSecret,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      },
      59_000,
    );

    expect(code).toBe("287082");
  });
});

describe("helpers", () => {
  it("validates Base32 secrets", () => {
    expect(isValidSecret("JBSW Y3DP EHPK 3PXP")).toBe(true);
    expect(isValidSecret("jbswy3dpehpk3pxp")).toBe(true);
    expect(isValidSecret("abc")).toBe(false);
    // 0, 1, 8 and 9 aren't base32 digits.
    expect(isValidSecret("AAAAAAAAAAAAAAA1")).toBe(false);
  });

  it("formats codes in two groups", () => {
    expect(formatCode("123456")).toBe("123 456");
    expect(formatCode("12345678")).toBe("1234 5678");
  });
});
