import { ReactNode, useEffect, useState } from "react";
import { Spinner } from "@heroui/react";

import OnboardingPage from "../pages/onboarding";
import UnlockPage from "../pages/unlock";
import { useVault } from "../providers/vault-provider";

export function VaultGate({ children }: { children: ReactNode }) {
  const { status } = useVault();
  // Prompt for the passkey automatically only when the app opens on the lock
  // screen, not after a manual or automatic lock.
  const [autoPrompt, setAutoPrompt] = useState(true);

  useEffect(() => {
    if (status === "unlocked" || status === "empty") setAutoPrompt(false);
  }, [status]);

  switch (status) {
    case "loading":
      return (
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    case "empty":
      return <OnboardingPage />;
    case "locked":
      return <UnlockPage autoPrompt={autoPrompt} />;
    default:
      return <>{children}</>;
  }
}
