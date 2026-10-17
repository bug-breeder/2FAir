import { useEffect, useState } from "react";
import { Alert, Button, Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MdCheckCircle,
  MdFingerprint,
  MdLock,
  MdWifiOff,
  MdDevices,
} from "react-icons/md";

import { Logo, Wordmark } from "../components/logo";
import { PasscodeSetup } from "../components/passcode-setup";
import { isPasskeyAvailable, PasskeyError } from "../lib/vault/passkey";
import { VaultRecord } from "../lib/vault/types";
import { addPasskey, createVault, setPasscode } from "../lib/vault/vault";
import { useVault } from "../providers/vault-provider";

type Step = "welcome" | "passcode" | "backup";

export default function OnboardingPage() {
  const { t } = useTranslation();
  const { saveSetup, finishSetup } = useVault();
  const [step, setStep] = useState<Step>("welcome");
  const [pending, setPending] = useState<{
    record: VaultRecord;
    key: CryptoKey;
  }>();
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string>();
  const passkeyAvailable = isPasskeyAvailable();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // A fresh vault always starts on the home screen, e.g. after a reset from
  // Settings.
  useEffect(() => {
    if (pathname !== "/") navigate("/", { replace: true });
  }, [pathname, navigate]);

  const handlePasskey = async () => {
    setCreating(true);
    setNotice(undefined);
    try {
      const { record, key } = await createVault();
      const withPasskey = await addPasskey(
        record,
        key,
        t("onboarding.passkeyName"),
      );

      // Save right away so the passkey we just created is never orphaned.
      await saveSetup(withPasskey);
      setPending({ record: withPasskey, key });
      setStep("backup");
    } catch (error) {
      const code = error instanceof PasskeyError ? error.code : "failed";

      if (code === "cancelled") {
        setNotice(t("onboarding.passkeyCancelled"));
      } else {
        setNotice(
          code === "unsupported"
            ? t("onboarding.passkeyUnavailable")
            : t("onboarding.prfUnsupported"),
        );
        setStep("passcode");
      }
    } finally {
      setCreating(false);
    }
  };

  const handlePasscodeOnly = async (passcode: string) => {
    const { record, key } = await createVault();

    await finishSetup(await setPasscode(record, key, passcode), key);
  };

  const handleBackupPasscode = async (passcode: string) => {
    if (!pending) return;
    await finishSetup(
      await setPasscode(pending.record, pending.key, passcode),
      pending.key,
    );
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <Logo />

        {step === "welcome" && (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-bold">
                <Wordmark text={t("onboarding.title")} />
              </h1>
              <p className="text-default-500">{t("onboarding.subtitle")}</p>
            </div>

            <ul className="flex w-full flex-col gap-3 text-sm">
              {[
                { icon: MdLock, text: t("onboarding.pointEncrypted") },
                { icon: MdWifiOff, text: t("onboarding.pointOffline") },
                { icon: MdDevices, text: t("onboarding.pointPrivate") },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-2xl bg-content2 px-3 py-2.5"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-800 dark:bg-secondary-100 dark:text-secondary-700">
                    <Icon className="text-lg" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="flex w-full flex-col gap-3">
              {passkeyAvailable && (
                <>
                  <Button
                    className="h-14 text-base font-semibold"
                    color="primary"
                    isLoading={creating}
                    radius="full"
                    size="lg"
                    startContent={
                      !creating && <MdFingerprint className="text-2xl" />
                    }
                    onPress={handlePasskey}
                  >
                    {creating
                      ? t("onboarding.waitingPasskey")
                      : t("onboarding.passkeyCta")}
                  </Button>
                  <p className="-mt-1 text-center text-xs text-default-500">
                    {t("onboarding.passkeyHint")}
                  </p>
                </>
              )}
              <Button
                color={passkeyAvailable ? "default" : "primary"}
                isDisabled={creating}
                radius="full"
                size="lg"
                variant={passkeyAvailable ? "light" : "solid"}
                onPress={() => setStep("passcode")}
              >
                {t("onboarding.passcodeCta")}
              </Button>
              {notice && (
                <p className="text-center text-sm text-warning">{notice}</p>
              )}
            </div>
          </>
        )}

        {step === "passcode" && (
          <>
            {notice && <Alert color="warning" title={notice} />}
            <PasscodeSetup onDone={handlePasscodeOnly} />
            <Button
              radius="full"
              variant="light"
              onPress={() => {
                setNotice(undefined);
                setStep("welcome");
              }}
            >
              {t("common.back")}
            </Button>
          </>
        )}

        {step === "backup" && pending && (
          <>
            <Chip
              color="success"
              startContent={<MdCheckCircle className="ml-1" />}
              variant="flat"
            >
              {t("onboarding.passkeyReady")}
            </Chip>
            <PasscodeSetup
              createBody={t("onboarding.backupBody")}
              createTitle={t("onboarding.backupTitle")}
              onDone={handleBackupPasscode}
            />
            <div className="flex flex-col items-center gap-2">
              <Button
                radius="full"
                variant="light"
                onPress={() => finishSetup(pending.record, pending.key)}
              >
                {t("onboarding.skip")}
              </Button>
              <p className="max-w-xs text-center text-xs text-default-500">
                {t("onboarding.skipWarning")}
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
