import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Divider } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { MdFingerprint } from "react-icons/md";

import { ConfirmModal } from "../components/confirm-modal";
import { Logo, Wordmark } from "../components/logo";
import { PasscodeInput } from "../components/passcode-input";
import {
  getLockedUntil,
  recordFailedAttempt,
  resetFailedAttempts,
} from "../lib/vault/lockout";
import { isPasskeyAvailable, PasskeyError } from "../lib/vault/passkey";
import { WrongPasscodeError } from "../lib/vault/vault";
import { toast } from "../lib/toast";
import { useVault } from "../providers/vault-provider";

export default function UnlockPage({ autoPrompt }: { autoPrompt: boolean }) {
  const { t } = useTranslation();
  const {
    passkeys,
    hasPasscode,
    unlockWithPasscode,
    unlockWithPasskey,
    resetVault,
  } = useVault();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(getLockedUntil);
  const [now, setNow] = useState(Date.now);
  const [showReset, setShowReset] = useState(false);
  const autoPrompted = useRef(false);
  const hasPasskey = passkeys.length > 0;
  const lockedOutFor = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  useEffect(() => {
    if (lockedOutFor <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, [lockedOutFor]);

  const handlePasskey = useCallback(
    async (silent = false) => {
      setBusy(true);
      try {
        await unlockWithPasskey();
        resetFailedAttempts();
      } catch (e) {
        const cancelled = e instanceof PasskeyError && e.code === "cancelled";

        if (!silent && !cancelled) toast.error(t("unlock.passkeyFailed"));
      } finally {
        setBusy(false);
      }
    },
    [t, unlockWithPasskey],
  );

  useEffect(() => {
    if (autoPrompt && hasPasskey && !autoPrompted.current) {
      autoPrompted.current = true;
      void handlePasskey(true);
    }
  }, [autoPrompt, hasPasskey, handlePasskey]);

  const handlePasscode = async (passcode: string) => {
    if (getLockedUntil() > Date.now()) return;
    setBusy(true);
    setError(undefined);
    try {
      await unlockWithPasscode(passcode);
      resetFailedAttempts();
    } catch (e) {
      if (!(e instanceof WrongPasscodeError)) throw e;
      recordFailedAttempt();
      setLockedUntil(getLockedUntil());
      setNow(Date.now());
      setError(t("unlock.wrong"));
      setAttempt((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <Logo />
        <h1 className="text-3xl font-bold">
          <Wordmark text={t("unlock.title")} />
        </h1>

        {hasPasskey && (
          <Button
            fullWidth
            className="h-14 text-base font-semibold"
            color="primary"
            isLoading={busy}
            radius="full"
            size="lg"
            startContent={!busy && <MdFingerprint className="text-2xl" />}
            onPress={() => handlePasskey()}
          >
            {t("unlock.withPasskey")}
          </Button>
        )}

        {hasPasskey && hasPasscode && (
          <div className="flex w-full items-center gap-3">
            <Divider className="flex-1" />
            <span className="text-xs text-default-500">
              {t("unlock.orPasscode")}
            </span>
            <Divider className="flex-1" />
          </div>
        )}

        {hasPasscode && (
          <div className="flex flex-col items-center gap-2">
            {!hasPasskey && (
              <p className="text-default-500">{t("unlock.enterPasscode")}</p>
            )}
            <PasscodeInput
              errorMessage={
                lockedOutFor > 0
                  ? t("unlock.lockedOut", { seconds: lockedOutFor })
                  : error
              }
              isDisabled={busy || lockedOutFor > 0}
              isInvalid={!!error || lockedOutFor > 0}
              resetKey={attempt}
              onComplete={handlePasscode}
            />
            {!hasPasskey && isPasskeyAvailable() && (
              <p className="mt-2 flex max-w-xs items-start gap-1.5 text-xs text-default-500">
                <MdFingerprint className="mt-px flex-shrink-0 text-sm" />
                {t("unlock.passkeyTip")}
              </p>
            )}
          </div>
        )}

        <Button
          className="text-default-500"
          radius="full"
          variant="light"
          onPress={() => setShowReset(true)}
        >
          {t("unlock.forgot")}
        </Button>
      </div>

      <ConfirmModal
        body={t("unlock.resetBody")}
        confirmLabel={t("unlock.resetConfirm")}
        isOpen={showReset}
        title={t("unlock.resetTitle")}
        onClose={() => setShowReset(false)}
        onConfirm={async () => {
          await resetVault();
          resetFailedAttempts();
        }}
      />
    </main>
  );
}
