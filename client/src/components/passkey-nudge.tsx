import { useState } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { MdFingerprint } from "react-icons/md";

import { useAddPasskey } from "../hooks/use-add-passkey";
import { isPasskeyAvailable } from "../lib/vault/passkey";
import { useVault } from "../providers/vault-provider";

const DISMISSED_KEY = "2fair.passkeyNudgeDismissed";

/** Suggests adding a passkey when the vault only unlocks with a passcode. */
export function PasskeyNudge({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { passkeys } = useVault();
  const { add, busy } = useAddPasskey();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "1",
  );

  if (dismissed || passkeys.length > 0 || !isPasskeyAvailable()) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  return (
    <Card className={className} shadow="sm">
      <CardBody className="flex flex-row flex-wrap items-center gap-x-4 gap-y-3 p-4">
        <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-800 dark:bg-secondary-100 dark:text-secondary-700">
            <MdFingerprint className="text-2xl" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">{t("home.passkeyNudgeTitle")}</p>
            <p className="text-sm text-default-500">
              {t("home.passkeyNudgeBody")}
            </p>
          </div>
        </div>
        <div className="ml-auto flex flex-shrink-0 gap-2">
          <Button radius="full" variant="light" onPress={dismiss}>
            {t("home.passkeyNudgeLater")}
          </Button>
          <Button color="primary" isLoading={busy} radius="full" onPress={add}>
            {t("settings.addPasskey")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
