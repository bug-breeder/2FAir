import { useEffect, useRef, useState } from "react";
import { InputOtp } from "@heroui/react";

export const PASSCODE_LENGTH = 6;

interface PasscodeInputProps {
  onComplete: (passcode: string) => void;
  isInvalid?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
  /** Change this value to clear the input. */
  resetKey?: unknown;
}

export function PasscodeInput({
  onComplete,
  isInvalid,
  errorMessage,
  isDisabled,
  resetKey,
}: PasscodeInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue("");
    inputRef.current?.focus();
  }, [resetKey]);

  return (
    <InputOtp
      ref={inputRef}
      allowedKeys="^[0-9]*$"
      aria-label="Passcode"
      classNames={{ base: "items-center", errorMessage: "text-center" }}
      errorMessage={errorMessage}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      length={PASSCODE_LENGTH}
      size="lg"
      type="password"
      value={value}
      onComplete={(v) => v && onComplete(v)}
      onValueChange={setValue}
    />
  );
}
