import { Secret, TOTP } from "otpauth";

import { isSameAccount } from "./vault/backup";
import { Algorithm, EntryInput } from "./vault/types";

export const ALGORITHMS: Algorithm[] = ["SHA1", "SHA256", "SHA512"];

export function normalizeSecret(secret: string): string {
  return secret.toUpperCase().replace(/[\s\-_=]/g, "");
}

export function isValidSecret(secret: string): boolean {
  const normalized = normalizeSecret(secret);

  if (!/^[A-Z2-7]{8,}$/.test(normalized)) return false;

  try {
    return Secret.fromBase32(normalized).bytes.length > 0;
  } catch {
    return false;
  }
}

function toTotp(entry: EntryInput): TOTP {
  return new TOTP({
    issuer: entry.issuer,
    label: entry.label || entry.issuer,
    algorithm: entry.algorithm,
    digits: entry.digits,
    period: entry.period,
    secret: Secret.fromBase32(normalizeSecret(entry.secret)),
  });
}

export function generateCode(
  entry: EntryInput,
  timestamp = Date.now(),
): string {
  return toTotp(entry).generate({ timestamp });
}

export function secondsRemaining(
  period: number,
  timestamp = Date.now(),
): number {
  return period - (Math.floor(timestamp / 1000) % period);
}

/** "123456" -> "123 456", "12345678" -> "1234 5678" */
export function formatCode(code: string): string {
  const half = Math.ceil(code.length / 2);

  return `${code.slice(0, half)} ${code.slice(half)}`;
}

export function buildOtpauthUri(entry: EntryInput): string {
  return toTotp(entry).toString();
}

export class OtpauthParseError extends Error {
  constructor(
    public code: "not-otpauth" | "not-totp" | "no-secret" | "bad-secret",
  ) {
    super(code);
  }
}

/** Parses an otpauth://totp/ URI (as found in 2FA QR codes). */
export function parseOtpauthUri(uri: string): EntryInput {
  let url: URL;

  try {
    url = new URL(uri.trim());
  } catch {
    throw new OtpauthParseError("not-otpauth");
  }

  if (url.protocol !== "otpauth:") throw new OtpauthParseError("not-otpauth");
  if (url.host.toLowerCase() !== "totp")
    throw new OtpauthParseError("not-totp");

  const params = url.searchParams;
  const secret = normalizeSecret(params.get("secret") ?? "");

  if (!secret) throw new OtpauthParseError("no-secret");
  if (!isValidSecret(secret)) throw new OtpauthParseError("bad-secret");

  // Path is "/Issuer:account" or "/account", URL-encoded.
  let path: string;

  try {
    path = decodeURIComponent(url.pathname.replace(/^\//, ""));
  } catch {
    throw new OtpauthParseError("not-otpauth");
  }

  const colon = path.indexOf(":");
  const pathIssuer = colon >= 0 ? path.slice(0, colon).trim() : "";
  const label = (colon >= 0 ? path.slice(colon + 1) : path).trim();

  const algorithm = (
    params.get("algorithm") ?? "SHA1"
  ).toUpperCase() as Algorithm;
  const digits = Number(params.get("digits") ?? 6);
  const period = Number(params.get("period") ?? 30);

  return {
    issuer: params.get("issuer")?.trim() || pathIssuer || label,
    label,
    secret,
    algorithm: ALGORITHMS.includes(algorithm) ? algorithm : "SHA1",
    digits: [6, 7, 8].includes(digits) ? digits : 6,
    period: period > 0 ? period : 30,
  };
}

/**
 * Finds every otpauth:// link in `text`, such as a plain-text export with one
 * link per line, dropping repeats. Links that aren't valid TOTP accounts are
 * counted in `skipped`; Google Authenticator otpauth-migration:// links in
 * `migration`.
 */
export function parseOtpauthList(text: string): {
  entries: EntryInput[];
  skipped: number;
  migration: number;
} {
  const entries: EntryInput[] = [];
  let skipped = 0;

  for (const [uri] of text.matchAll(/otpauth:\/\/[^\s"'<>]+/gi)) {
    let entry: EntryInput;

    try {
      entry = parseOtpauthUri(uri);
    } catch {
      skipped++;
      continue;
    }
    if (!entries.some((e) => isSameAccount(e, entry))) entries.push(entry);
  }

  const migration = text.match(/otpauth-migration:\/\//gi)?.length ?? 0;

  return { entries, skipped, migration };
}

/** One otpauth:// link per line, the format parseOtpauthList reads. */
export function buildOtpauthList(entries: EntryInput[]): string {
  return entries.map((entry) => `${buildOtpauthUri(entry)}\n`).join("");
}
