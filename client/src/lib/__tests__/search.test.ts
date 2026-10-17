import { describe, it, expect } from "vitest";

import { searchEntries } from "../search";
import { Entry } from "../vault/types";

const entry = (id: string, issuer: string, label: string): Entry => ({
  id,
  issuer,
  label,
  secret: "JBSWY3DPEHPK3PXP",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

const entries = [
  entry("1", "GitHub", "user@example.com"),
  entry("2", "Google", "work@company.com"),
  entry("3", "Microsoft", "user@example.com"),
];

describe("searchEntries", () => {
  it("returns everything for an empty or blank query", () => {
    expect(searchEntries(entries, "")).toEqual(entries);
    expect(searchEntries(entries, "   ")).toEqual(entries);
  });

  it("matches issuer case-insensitively", () => {
    expect(searchEntries(entries, "github").map((e) => e.id)).toEqual(["1"]);
  });

  it("matches label", () => {
    expect(searchEntries(entries, "company").map((e) => e.id)).toEqual(["2"]);
  });

  it("requires every term to match", () => {
    expect(searchEntries(entries, "user micro").map((e) => e.id)).toEqual([
      "3",
    ]);
    expect(searchEntries(entries, "github work")).toEqual([]);
  });
});
