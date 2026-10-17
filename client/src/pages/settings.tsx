import { ReactNode, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
} from "@heroui/react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  MdAdd,
  MdDelete,
  MdDownload,
  MdFingerprint,
  MdInstallMobile,
  MdPin,
  MdUpload,
  MdWarningAmber,
} from "react-icons/md";

import { ConfirmModal } from "../components/confirm-modal";
import { PasscodeSetup } from "../components/passcode-setup";
import { useAddPasskey } from "../hooks/use-add-passkey";
import DefaultLayout from "../layouts/default";
import { LANGUAGES } from "../lib/i18n";
import { isIos, isStandalone, useInstallPrompt } from "../lib/pwa";
import { toast } from "../lib/toast";
import { buildOtpauthList, parseOtpauthList } from "../lib/totp";
import {
  BackupError,
  createBackup,
  downloadTextFile,
  isBackupFile,
  readBackup,
} from "../lib/vault/backup";
import { isPasskeyAvailable } from "../lib/vault/passkey";
import { AUTO_LOCK_OPTIONS, AutoLock } from "../lib/vault/preferences";
import { EntryInput } from "../lib/vault/types";
import { PasskeyInfo, useVault } from "../providers/vault-provider";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-lg font-bold">{title}</h2>
      <Card shadow="sm">
        <CardBody className="divide-y divide-divider p-0">{children}</CardBody>
      </Card>
    </section>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      {/* On narrow screens, controls wrap under the text rather than squeeze
       * the description into a thin column. */}
      <div className={`min-w-0 flex-1 ${description ? "basis-60" : ""}`}>
        <div className="font-medium">{title}</div>
        {description && (
          <div className="text-sm text-default-500">{description}</div>
        )}
      </div>
      {children && (
        <div className="flex flex-shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}

type Dialog =
  | "passcode"
  | "removePasscode"
  | "export"
  | "import"
  | "reset"
  | { removePasskey: PasskeyInfo };

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const vault = useVault();
  const { canInstall, install } = useInstallPrompt();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const { add: handleAddPasskey, busy: addingPasskey } = useAddPasskey();
  const close = () => setDialog(null);
  const canRemoveMethod =
    (vault.hasPasscode ? 1 : 0) + vault.passkeys.length > 1;
  const language = LANGUAGES.find((l) => i18n.resolvedLanguage === l) ?? "en";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.resolvedLanguage, {
      dateStyle: "medium",
    });

  return (
    <DefaultLayout>
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>

        <Section title={t("settings.security")}>
          <Row
            description={t("settings.passkeysHint")}
            title={
              <span className="flex items-center gap-2">
                <MdFingerprint className="text-lg text-secondary-700" />{" "}
                {t("settings.passkeys")}
              </span>
            }
          >
            {isPasskeyAvailable() && (
              <Button
                isLoading={addingPasskey}
                radius="full"
                startContent={!addingPasskey && <MdAdd />}
                variant="flat"
                onPress={handleAddPasskey}
              >
                {t("settings.addPasskey")}
              </Button>
            )}
          </Row>
          {vault.passkeys.length === 0 ? (
            <div className="px-4 py-3 text-sm text-default-500">
              {t("settings.noPasskeys")}
            </div>
          ) : (
            vault.passkeys.map((passkey) => (
              <Row
                key={passkey.id}
                description={t("settings.addedOn", {
                  date: formatDate(passkey.createdAt),
                })}
                title={<span className="pl-6 text-sm">{passkey.name}</span>}
              >
                <Button
                  isIconOnly
                  aria-label={t("common.remove")}
                  isDisabled={!canRemoveMethod}
                  radius="full"
                  variant="light"
                  onPress={() => setDialog({ removePasskey: passkey })}
                >
                  <MdDelete className="text-lg text-default-400" />
                </Button>
              </Row>
            ))
          )}
          <Row
            description={t("settings.passcodeHint")}
            title={
              <span className="flex items-center gap-2">
                <MdPin className="text-lg text-secondary-700" />{" "}
                {t("settings.passcode")}
                <Chip
                  color={vault.hasPasscode ? "success" : "default"}
                  size="sm"
                  variant="flat"
                >
                  {vault.hasPasscode
                    ? t("settings.passcodeOn")
                    : t("settings.passcodeOff")}
                </Chip>
              </span>
            }
          >
            {vault.hasPasscode && (
              <Button
                isDisabled={!canRemoveMethod}
                radius="full"
                variant="light"
                onPress={() => setDialog("removePasscode")}
              >
                {t("common.remove")}
              </Button>
            )}
            <Button
              radius="full"
              variant="flat"
              onPress={() => setDialog("passcode")}
            >
              {vault.hasPasscode
                ? t("settings.changePasscode")
                : t("settings.setPasscode")}
            </Button>
          </Row>
          <Row
            description={t("settings.autoLockHint")}
            title={t("settings.autoLock")}
          >
            <Select
              disallowEmptySelection
              aria-label={t("settings.autoLock")}
              className="w-40"
              selectedKeys={[vault.autoLock]}
              onSelectionChange={(keys) =>
                vault.setAutoLock(Array.from(keys)[0] as AutoLock)
              }
            >
              {AUTO_LOCK_OPTIONS.map((option) => (
                <SelectItem key={option}>
                  {t(`settings.autoLockOptions.${option}`)}
                </SelectItem>
              ))}
            </Select>
          </Row>
        </Section>

        <Section title={t("settings.backup")}>
          <Row
            description={t("settings.backupHint")}
            title={t("settings.export")}
          >
            <Button
              isDisabled={vault.entries.length === 0}
              radius="full"
              startContent={<MdDownload />}
              variant="flat"
              onPress={() => setDialog("export")}
            >
              {t("settings.exportAction")}
            </Button>
          </Row>
          <Row
            description={t("settings.importHint")}
            title={t("settings.import")}
          >
            <Button
              radius="full"
              startContent={<MdUpload />}
              variant="flat"
              onPress={() => setDialog("import")}
            >
              {t("settings.importAction")}
            </Button>
          </Row>
        </Section>

        <Section title={t("settings.appearance")}>
          <Row title={t("settings.theme")}>
            <Select
              disallowEmptySelection
              aria-label={t("settings.theme")}
              className="w-40"
              selectedKeys={[theme ?? "system"]}
              onSelectionChange={(keys) =>
                setTheme(String(Array.from(keys)[0]))
              }
            >
              {(["system", "light", "dark"] as const).map((option) => (
                <SelectItem key={option}>
                  {t(`settings.themeOptions.${option}`)}
                </SelectItem>
              ))}
            </Select>
          </Row>
          <Row title={t("settings.language")}>
            <Select
              disallowEmptySelection
              aria-label={t("settings.language")}
              className="w-40"
              selectedKeys={[language]}
              onSelectionChange={(keys) =>
                i18n.changeLanguage(String(Array.from(keys)[0]))
              }
            >
              {LANGUAGES.map((lng) => (
                <SelectItem key={lng}>{t(`language.${lng}`)}</SelectItem>
              ))}
            </Select>
          </Row>
          {!isStandalone() && (canInstall || isIos()) && (
            <Row
              description={
                canInstall
                  ? t("settings.installHint")
                  : t("settings.installIos")
              }
              title={t("settings.install")}
            >
              {canInstall && (
                <Button
                  radius="full"
                  startContent={<MdInstallMobile />}
                  variant="flat"
                  onPress={install}
                >
                  {t("settings.install")}
                </Button>
              )}
            </Row>
          )}
        </Section>

        <Section title={t("settings.danger")}>
          <Row
            description={t("settings.resetHint")}
            title={t("settings.reset")}
          >
            <Button
              color="danger"
              radius="full"
              variant="flat"
              onPress={() => setDialog("reset")}
            >
              {t("settings.reset")}
            </Button>
          </Row>
        </Section>

        <Section title={t("settings.about")}>
          <Row
            description={`${t("settings.aboutBody")} v${__APP_VERSION__}`}
            title="2FAir"
          >
            <Link
              isExternal
              showAnchorIcon
              href="https://github.com/bug-breeder/2FAir"
            >
              {t("settings.sourceCode")}
            </Link>
          </Row>
        </Section>
      </div>

      <Modal isOpen={dialog === "passcode"} placement="center" onClose={close}>
        <ModalContent>
          <ModalBody className="py-8">
            <PasscodeSetup
              onDone={async (passcode) => {
                await vault.changePasscode(passcode);
                toast.success(t("settings.passcodeSaved"));
                close();
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <ConfirmModal
        body={t("onboarding.skipWarning")}
        confirmLabel={t("common.remove")}
        isOpen={dialog === "removePasscode"}
        title={`${t("common.remove")} ${t("settings.passcode").toLowerCase()}?`}
        onClose={close}
        onConfirm={async () => {
          await vault.removePasscode();
          toast.success(t("settings.passcodeRemoved"));
        }}
      />

      <ConfirmModal
        body={t("settings.keepOne")}
        confirmLabel={t("common.remove")}
        isOpen={typeof dialog === "object" && dialog !== null}
        title={`${t("common.remove")} ${
          typeof dialog === "object" && dialog ? dialog.removePasskey.name : ""
        }?`}
        onClose={close}
        onConfirm={async () => {
          if (typeof dialog !== "object" || !dialog) return;
          await vault.removePasskey(dialog.removePasskey.id);
          toast.success(t("settings.passkeyRemoved"));
        }}
      />

      <ExportModal isOpen={dialog === "export"} onClose={close} />
      <ImportModal isOpen={dialog === "import"} onClose={close} />

      <ConfirmModal
        body={t("unlock.resetBody")}
        confirmLabel={t("unlock.resetConfirm")}
        isOpen={dialog === "reset"}
        title={t("unlock.resetTitle")}
        onClose={close}
        onConfirm={vault.resetVault}
      />
    </DefaultLayout>
  );
}

type ExportFormat = "backup" | "links";

/** Exports an encrypted backup, or plain otpauth:// links for other apps. */
function ExportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { entries } = useVault();
  const [format, setFormat] = useState<ExportFormat>("backup");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canExport =
    format === "backup"
      ? password.length >= 8 && password === confirm
      : understood;

  const handleClose = () => {
    setFormat("backup");
    setPassword("");
    setConfirm("");
    setUnderstood(false);
    onClose();
  };

  const handleExport = async () => {
    const date = new Date().toISOString().slice(0, 10);

    setBusy(true);
    try {
      if (format === "backup") {
        downloadTextFile(
          `2fair-backup-${date}.json`,
          await createBackup(entries, password),
        );
        toast.success(t("settings.exported"));
      } else {
        downloadTextFile(
          `2fair-accounts-${date}.txt`,
          buildOtpauthList(entries),
          "text/plain",
        );
        toast.success(t("settings.exportedLinks"));
      }
      handleClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} placement="center" onClose={handleClose}>
      <ModalContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canExport) void handleExport();
          }}
        >
          <ModalHeader>{t("settings.exportTitle")}</ModalHeader>
          <ModalBody>
            <RadioGroup
              aria-label={t("settings.exportFormat")}
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
            >
              {(["backup", "links"] as const).map((value) => (
                <Radio
                  key={value}
                  classNames={{
                    base: "m-0 w-full max-w-full cursor-pointer items-start gap-2 rounded-medium border-2 border-transparent bg-content2 p-3 data-[selected=true]:border-primary",
                    labelWrapper: "ms-1",
                    label: "font-semibold",
                  }}
                  description={t(`settings.format.${value}Hint`)}
                  value={value}
                >
                  {t(`settings.format.${value}`)}
                </Radio>
              ))}
            </RadioGroup>
            {format === "backup" ? (
              <>
                <Input
                  autoComplete="new-password"
                  description={t("settings.backupPasswordHint")}
                  errorMessage={t("settings.passwordTooShort")}
                  isInvalid={tooShort}
                  label={t("settings.backupPassword")}
                  type="password"
                  value={password}
                  onValueChange={setPassword}
                />
                <Input
                  autoComplete="new-password"
                  errorMessage={t("settings.passwordMismatch")}
                  isInvalid={mismatch}
                  label={t("settings.confirmPassword")}
                  type="password"
                  value={confirm}
                  onValueChange={setConfirm}
                />
              </>
            ) : (
              <>
                <p className="flex gap-2 rounded-medium bg-warning-50 p-3 text-sm text-warning-800">
                  <MdWarningAmber className="mt-0.5 flex-shrink-0 text-base" />
                  {t("settings.linksWarning")}
                </p>
                <Checkbox
                  classNames={{ label: "text-sm" }}
                  isSelected={understood}
                  onValueChange={setUnderstood}
                >
                  {t("settings.linksConfirm")}
                </Checkbox>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button radius="full" variant="light" onPress={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              isDisabled={!canExport}
              isLoading={busy}
              radius="full"
              startContent={!busy && <MdDownload />}
              type="submit"
            >
              {t("settings.exportAction")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// Plenty for thousands of accounts; keeps a wrong pick from freezing the tab.
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

type ImportSource =
  | { kind: "backup"; text: string }
  | { kind: "links"; entries: EntryInput[]; skipped: number };

/** Imports a 2FAir backup or a text file of otpauth:// links. */
function ImportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { importEntries } = useVault();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<ImportSource | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handleClose = () => {
    setFile(null);
    setSource(null);
    setPassword("");
    setError(undefined);
    onClose();
  };

  const handleFile = async (picked: File | undefined) => {
    setFile(picked ?? null);
    setSource(null);
    setPassword("");
    setError(undefined);
    if (!picked) return;

    const text = picked.size <= MAX_IMPORT_BYTES ? await picked.text() : "";

    if (isBackupFile(text)) {
      setSource({ kind: "backup", text });

      return;
    }

    const { entries, skipped, migration } = parseOtpauthList(text);

    if (entries.length > 0) {
      setSource({ kind: "links", entries, skipped });
    } else {
      setError(
        migration > 0 ? t("scan.migration") : t("settings.unsupportedFile"),
      );
    }
  };

  const handleImport = async () => {
    if (!source) return;
    setBusy(true);
    setError(undefined);
    try {
      const entries =
        source.kind === "backup"
          ? await readBackup(source.text, password)
          : source.entries;
      const added = await importEntries(entries);
      const existing = entries.length - added;

      toast.success(
        added === 0
          ? t("settings.importedNone")
          : existing > 0
            ? t("settings.importedWithExisting", { count: added, existing })
            : t("settings.imported", { count: added }),
      );
      handleClose();
    } catch (e) {
      setError(
        e instanceof BackupError && e.code === "wrong-password"
          ? t("settings.wrongPassword")
          : t("settings.invalidFile"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} placement="center" onClose={handleClose}>
      <ModalContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleImport();
          }}
        >
          <ModalHeader>{t("settings.importTitle")}</ModalHeader>
          <ModalBody>
            <Button
              className="justify-start"
              radius="full"
              startContent={<MdUpload />}
              variant="flat"
              onPress={() => fileRef.current?.click()}
            >
              <span className="truncate">
                {file ? file.name : t("settings.chooseFile")}
              </span>
            </Button>
            <input
              ref={fileRef}
              accept=".json,.txt,application/json,text/plain"
              className="hidden"
              type="file"
              onChange={(e) => {
                const picked = e.target.files?.[0];

                // Let the same file be picked again after fixing it.
                e.target.value = "";
                void handleFile(picked);
              }}
            />
            {!source && (
              <p
                className={`px-1 text-sm ${error ? "text-danger" : "text-default-500"}`}
              >
                {error ?? t("settings.importFileHint")}
              </p>
            )}
            {source?.kind === "backup" && (
              <Input
                autoComplete="off"
                errorMessage={error}
                isInvalid={!!error}
                label={t("settings.backupPassword")}
                type="password"
                value={password}
                onValueChange={(v) => {
                  setPassword(v);
                  setError(undefined);
                }}
              />
            )}
            {source?.kind === "links" && (
              <>
                <p className="px-1 text-sm font-semibold">
                  {t("settings.found", { count: source.entries.length })}
                </p>
                <ul
                  aria-label={t("settings.found", {
                    count: source.entries.length,
                  })}
                  className="max-h-48 divide-y divide-divider overflow-y-auto rounded-medium bg-content2"
                >
                  {source.entries.map((entry, i) => (
                    <li key={i} className="px-3 py-2">
                      <div className="truncate text-sm font-medium">
                        {entry.issuer}
                      </div>
                      {entry.label && entry.label !== entry.issuer && (
                        <div className="truncate text-xs text-default-500">
                          {entry.label}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {source.skipped > 0 && (
                  <p className="px-1 text-sm text-warning">
                    {t("settings.skippedLinks", { count: source.skipped })}
                  </p>
                )}
                <p className="flex gap-2 rounded-medium bg-warning-50 p-3 text-sm text-warning-800">
                  <MdWarningAmber className="mt-0.5 flex-shrink-0 text-base" />
                  {t("settings.plaintextWarning")}
                </p>
                {error && <p className="px-1 text-sm text-danger">{error}</p>}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button radius="full" variant="light" onPress={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              isDisabled={!source || (source.kind === "backup" && !password)}
              isLoading={busy}
              radius="full"
              type="submit"
            >
              {t("settings.importAction")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
