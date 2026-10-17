import { useState } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "../lib/toast";
import { PasskeyError } from "../lib/vault/passkey";
import { useVault } from "../providers/vault-provider";

/** Registers a new passkey for the unlocked vault, with toasts. */
export function useAddPasskey() {
  const { t } = useTranslation();
  const { addPasskey } = useVault();
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      await addPasskey(t("onboarding.passkeyName"));
      toast.success(t("settings.passkeyAdded"));
    } catch (error) {
      if (error instanceof PasskeyError && error.code === "cancelled") return;
      toast.error(
        error instanceof PasskeyError && error.code === "prf-unsupported"
          ? t("onboarding.prfUnsupported")
          : t("common.error"),
      );
    } finally {
      setBusy(false);
    }
  };

  return { add, busy };
}
