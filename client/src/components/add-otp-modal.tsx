import React, { useState } from "react";
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

interface AddOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validation functions
const validateSecret = (secret: string): string | null => {
  if (!secret) return "Secret is required";

  // Remove spaces and common separators
  const normalized = secret.toUpperCase().replace(/[\s\-_]/g, "");

  // Check base32 format (A-Z, 2-7)
  if (!/^[A-Z2-7]+$/.test(normalized)) {
    return "Secret must contain only letters A-Z and digits 2-7";
  }

  if (normalized.length < 16) {
    return "Secret too short (minimum 16 characters for security)";
  }

  if (normalized.length > 128) {
    return "Secret too long (maximum 128 characters)";
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

const AddOtpModal: React.FC<AddOtpModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    issuer: "",
    label: "",
    secret: "",
    algorithm: "SHA1",
    digits: "6",
    period: "30",
    method: "TOTP",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const addOtpMutation = useAddOtp();
  const { refetch } = useListOtps(); // Hook to refetch the OTP list

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const secretError = validateSecret(formData.secret);

    if (secretError) newErrors.secret = secretError;

    const issuerError = validateIssuer(formData.issuer);

    if (issuerError) newErrors.issuer = issuerError;

    const labelError = validateLabel(formData.label);

    if (labelError) newErrors.label = labelError;

    const period = parseInt(formData.period);

    if (period < 15 || period > 300) {
      newErrors.period = "Period must be between 15 and 300 seconds";
    }

    const digits = parseInt(formData.digits);

    if (digits < 6 || digits > 8) {
      newErrors.digits = "Digits must be between 6 and 8";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleAddOtp = () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");

      return;
    }

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
      secret: formData.secret.toUpperCase().replace(/[\s\-_]/g, ""), // Normalize secret
    };

    addOtpMutation.mutate(otpData, {
      onSuccess: () => {
        refetch(); // Refetch the OTP list
        onClose();
        setFormData({
          issuer: "",
          label: "",
          secret: "",
          algorithm: "SHA1",
          digits: "6",
          period: "30",
          method: "TOTP",
        });
        setErrors({});
        toast.success("OTP added successfully");
      },
      onError: (error: any) => {
        console.error("Error adding OTP:", error);
        const errorMessage = error.response?.data?.error || "Failed to add OTP";

        toast.error(errorMessage);
      },
    });
  };

  const handleClose = () => {
    onClose();
    setFormData({
      issuer: "",
      label: "",
      secret: "",
      algorithm: "SHA1",
      digits: "6",
      period: "30",
      method: "TOTP",
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={handleClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">Add New OTP</ModalHeader>
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
              description="Base32 encoded secret key (A-Z, 2-7)"
              errorMessage={errors.secret}
              isInvalid={!!errors.secret}
              label="Secret"
              placeholder="e.g., JBSWY3DPEHPK3PXP"
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
              isDisabled={addOtpMutation.isPending}
              onPress={handleAddOtp}
            >
              {addOtpMutation.isPending ? "Adding..." : "Add OTP"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AddOtpModal;
