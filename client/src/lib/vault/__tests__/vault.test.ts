import { describe, it, expect } from "vitest";

import { BackupError, createBackup, isBackupFile, readBackup } from "../backup";
import { Entry } from "../types";
import {
  createVault,
  readEntries,
  removePasscode,
  setPasscode,
  unlockWithPasscode,
  WrongPasscodeError,
  writeEntries,
} from "../vault";

const sample: Entry = {
  id: "1",
  issuer: "GitHub",
  label: "me@example.com",
  secret: "JBSWY3DPEHPK3PXP",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("vault", () => {
  it("unlocks with the right passcode and reads entries back", async () => {
    const { record, key } = await createVault();
    const withPasscode = await setPasscode(record, key, "123456");
    const withEntries = await writeEntries(withPasscode, key, [sample]);

    // Nothing sensitive is stored in the clear.
    expect(JSON.stringify(withEntries)).not.toContain(sample.secret);
    expect(JSON.stringify(withEntries)).not.toContain(sample.issuer);

    const unlocked = await unlockWithPasscode(withEntries, "123456");

    expect(await readEntries(withEntries, unlocked)).toEqual([sample]);
  });

  it("rejects a wrong passcode", async () => {
    const { record, key } = await createVault();
    const withPasscode = await setPasscode(record, key, "123456");

    await expect(
      unlockWithPasscode(withPasscode, "654321"),
    ).rejects.toBeInstanceOf(WrongPasscodeError);
  });

  it("changing the passcode keeps entries readable", async () => {
    const { record, key } = await createVault();
    let next = await writeEntries(
      await setPasscode(record, key, "111111"),
      key,
      [sample],
    );

    next = await setPasscode(next, key, "222222");

    await expect(unlockWithPasscode(next, "111111")).rejects.toThrow();
    expect(
      await readEntries(next, await unlockWithPasscode(next, "222222")),
    ).toEqual([sample]);
    expect(removePasscode(next).passcode).toBeUndefined();
  });
});

describe("backup", () => {
  it("round-trips entries with the right password", async () => {
    const file = await createBackup([sample], "correct horse");

    expect(file).not.toContain(sample.secret);
    expect(await readBackup(file, "correct horse")).toEqual([sample]);
  });

  it("reports wrong password and invalid files", async () => {
    const file = await createBackup([sample], "correct horse");

    await expect(readBackup(file, "nope")).rejects.toMatchObject({
      code: "wrong-password",
    });
    await expect(readBackup("{}", "x")).rejects.toBeInstanceOf(BackupError);
    await expect(readBackup("not json", "x")).rejects.toMatchObject({
      code: "invalid-file",
    });
  });

  it("tells backups apart from other files", async () => {
    expect(isBackupFile(await createBackup([sample], "correct horse"))).toBe(
      true,
    );
    expect(isBackupFile('{"app":"2FAir"}')).toBe(false);
    expect(
      isBackupFile("otpauth://totp/GitHub:me?secret=JBSWY3DPEHPK3PXP"),
    ).toBe(false);
  });
});
