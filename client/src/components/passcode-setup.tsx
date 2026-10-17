import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PasscodeInput } from "./passcode-input";

interface PasscodeSetupProps {
  onDone: (passcode: string) => Promise<void> | void;
  createTitle?: string;
  createBody?: string;
}

/** Enter a new passcode, then confirm it. */
export function PasscodeSetup({
  onDone,
  createTitle,
  createBody,
}: PasscodeSetupProps) {
  const { t } = useTranslation();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handleComplete = async (passcode: string) => {
    if (first === null) {
      setFirst(passcode);
      setError(undefined);

      return;
    }

    if (passcode !== first) {
      setFirst(null);
      setError(t("onboarding.mismatch"));

      return;
    }

    setBusy(true);
    try {
      await onDone(passcode);
    } finally {
      setBusy(false);
    }
  };

  const confirming = first !== null;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          {confirming
            ? t("onboarding.confirmTitle")
            : (createTitle ?? t("onboarding.createTitle"))}
        </h2>
        <p className="text-sm text-default-500">
          {confirming
            ? t("onboarding.confirmBody")
            : (createBody ?? t("onboarding.createBody"))}
        </p>
      </div>
      <PasscodeInput
        errorMessage={error}
        isDisabled={busy}
        isInvalid={!!error}
        resetKey={`${confirming}-${error}`}
        onComplete={handleComplete}
      />
    </div>
  );
}
