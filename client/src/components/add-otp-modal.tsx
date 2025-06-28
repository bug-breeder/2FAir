import { useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";

import { useAddOtp, useListOtps } from "../hooks/otp";
import { toast } from "../lib/toast";
import { validateTOTPSecret, normalizeTOTPSecret } from "../lib/totp";
import { encryptData } from "../lib/crypto";
import { getSessionEncryptionKey, isWebAuthnSupported } from "../lib/webauthn";

import { WebAuthnRegistrationModal } from "./webauthn-registration-modal";

interface AddOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  issuer: string;
  label: string;
  secret: string;
  algorithm: string;
  digits: string;
  period: string;
  method: string;
}

// Validation utilities - extracted from component for reusability
const validateSecret = (secret: string): string | null => {
  if (!secret) return "Secret is required";

  if (!validateTOTPSecret(secret)) {
    return "Secret must be Base32 format (A-Z, 2-7) and 16-128 characters";
  }

  return null;
};

const validateIssuer = (issuer: string): string | null => {
  if (!issuer.trim()) return "Issuer is required";
  if (issuer.length > 100) return "Issuer too long (maximum 100 characters)";
  if (issuer.includes(":") || issuer.includes(";"))
    return "Issuer cannot contain ':' or ';'";

  return null;
};

const validateLabel = (label: string): string | null => {
  if (!label.trim()) return "Label is required";
  if (label.length > 100) return "Label too long (maximum 100 characters)";
  if (label.includes(":") || label.includes(";"))
    return "Label cannot contain ':' or ';'";

  return null;
};

const validatePeriod = (period: string): string | null => {
  const periodNum = parseInt(period);

  if (periodNum < 15 || periodNum > 300) {
    return "Period must be between 15 and 300 seconds";
  }

  return null;
};

const validateDigits = (digits: string): string | null => {
  const digitsNum = parseInt(digits);

  if (digitsNum < 6 || digitsNum > 8) {
    return "Digits must be between 6 and 8";
  }

  return null;
};

// Initial form state
const getInitialFormData = (): FormData => ({
  issuer: "",
  label: "",
  secret: "",
  algorithm: "SHA1",
  digits: "6",
  period: "30",
  method: "TOTP",
});

export function AddOtpModal({ isOpen, onClose }: AddOtpModalProps) {
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [showWebAuthnRegistration, setShowWebAuthnRegistration] =
    useState(false);

  const addOtpMutation = useAddOtp();
  const { refetch } = useListOtps();

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    const secretError = validateSecret(formData.secret);

    if (secretError) newErrors.secret = secretError;

    const issuerError = validateIssuer(formData.issuer);

    if (issuerError) newErrors.issuer = issuerError;

    const labelError = validateLabel(formData.label);

    if (labelError) newErrors.label = labelError;

    const periodError = validatePeriod(formData.period);

    if (periodError) newErrors.period = periodError;

    const digitsError = validateDigits(formData.digits);

    if (digitsError) newErrors.digits = digitsError;

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  const handleWebAuthnRegistrationSuccess = useCallback(() => {
    setShowWebAuthnRegistration(false);
    toast.success("WebAuthn registered! Now you can add encrypted TOTPs.");
  }, []);

  const handleAddOtp = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");

      return;
    }

    // Check WebAuthn support
    if (!isWebAuthnSupported()) {
      toast.error(
        "WebAuthn is not supported by this browser. Please use a modern browser with security key support.",
      );

      return;
    }

    setIsEncrypting(true);

    try {
      // Get session encryption key (will authenticate if needed)
      const encryptionKey = await getSessionEncryptionKey();

      // Normalize and encrypt the TOTP secret
      const normalizedSecret = normalizeTOTPSecret(formData.secret);
      const encryptedSecret = await encryptData(
        normalizedSecret,
        encryptionKey,
      );

      // Format encrypted secret as ciphertext.iv.authTag for backend storage
      const secretForBackend = `${encryptedSecret.ciphertext}.${encryptedSecret.iv}.${encryptedSecret.authTag}`;

      const otpData = {
        active: true,
        algorithm: formData.algorithm,
        counter: 0,
        createdAt: new Date().toISOString(),
        digits: parseInt(formData.digits),
        issuer: formData.issuer.trim(),
        label: formData.label.trim(),
        method: formData.method,
        period: parseInt(formData.period),
        secret: secretForBackend, // Encrypted TOTP secret
      };

      addOtpMutation.mutate(otpData, {
        onSuccess: () => {
          refetch(); // Refetch the OTP list
          handleClose();
          toast.success("OTP added successfully with end-to-end encryption");
        },
        onError: (error: any) => {
          console.error("Error adding OTP:", error);
          const errorMessage =
            error.response?.data?.error || "Failed to add OTP";

          toast.error(errorMessage);
        },
      });
    } catch (error) {
      console.error("Encryption or authentication failed:", error);

      // Check if this is a "no credentials" error
      if (
        error instanceof Error &&
        error.message.includes("WebAuthn authentication failed")
      ) {
        // This could be because the user doesn't have WebAuthn credentials registered
        setShowWebAuthnRegistration(true);

        return;
      }

      toast.error(
        `Failed to encrypt OTP secret: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsEncrypting(false);
    }
  }, [formData, validateForm, addOtpMutation, refetch, handleClose]);

  return (
    <>
      <Modal isOpen={isOpen} placement="center" onOpenChange={handleClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>Add New OTP</span>
            <p className="text-sm text-default-500 font-normal">
              🔒 Your TOTP secret will be encrypted client-side before storage
            </p>
          </ModalHeader>
          <ModalBody>
            <Input
              description="The service provider name"
              errorMessage={errors.issuer}
              isInvalid={!!errors.issuer}
              label="Issuer"
              placeholder="e.g., Google, GitHub, Microsoft"
              value={formData.issuer}
              onChange={(e) => handleInputChange("issuer", e.target.value)}
            />
            <Input
              description="Your account identifier"
              errorMessage={errors.label}
              isInvalid={!!errors.label}
              label="Label"
              placeholder="e.g., john@example.com, username"
              value={formData.label}
              onChange={(e) => handleInputChange("label", e.target.value)}
            />
            <Input
              description="Base32 encoded secret key (A-Z, 2-7) - will be encrypted"
              errorMessage={errors.secret}
              isInvalid={!!errors.secret}
              label="Secret"
              placeholder="e.g., JBSWY3DPEHPK3PXP"
              type="password"
              value={formData.secret}
              onChange={(e) => handleInputChange("secret", e.target.value)}
            />
            <div className="flex gap-2">
              <Select
                label="Algorithm"
                selectedKeys={[formData.algorithm]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;

                  handleInputChange("algorithm", value);
                }}
              >
                <SelectItem key="SHA1">SHA1</SelectItem>
                <SelectItem key="SHA256">SHA256</SelectItem>
                <SelectItem key="SHA512">SHA512</SelectItem>
              </Select>
              <Input
                errorMessage={errors.digits}
                isInvalid={!!errors.digits}
                label="Digits"
                max="8"
                min="6"
                placeholder="6"
                type="number"
                value={formData.digits}
                onChange={(e) => handleInputChange("digits", e.target.value)}
              />
            </div>
            <Input
              description="Time interval for code generation (15-300 seconds)"
              errorMessage={errors.period}
              isInvalid={!!errors.period}
              label="Period (seconds)"
              max="300"
              min="15"
              placeholder="30"
              type="number"
              value={formData.period}
              onChange={(e) => handleInputChange("period", e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleClose}>
              Cancel
            </Button>
            <Button
              color="success"
              isDisabled={addOtpMutation.isPending || isEncrypting}
              onPress={handleAddOtp}
            >
              {isEncrypting
                ? "🔐 Encrypting..."
                : addOtpMutation.isPending
                  ? "Adding..."
                  : "🔒 Add OTP (Encrypted)"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* WebAuthn Registration Modal */}
      <WebAuthnRegistrationModal
        isOpen={showWebAuthnRegistration}
        onClose={() => setShowWebAuthnRegistration(false)}
        onSuccess={handleWebAuthnRegistrationSuccess}
      />
    </>
  );
}
