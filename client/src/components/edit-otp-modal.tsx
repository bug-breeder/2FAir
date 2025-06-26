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

import { useEditOtp } from "../hooks/otp";
import { toast } from "../lib/toast";
import { OTP } from "../types/otp";

interface EditOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  otp: OTP;
}

// Validation utilities - extracted for reusability
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

export function EditOtpModal({ isOpen, onClose, otp }: EditOtpModalProps) {
  const [formData, setFormData] = useState({
    issuer: otp.Issuer,
    label: otp.Label,
    algorithm: "SHA1", // Default algorithm
    digits: "6",
    period: otp.Period.toString(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const editOtpMutation = useEditOtp();

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

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
  }, [formData]);

  const handleEditOtp = useCallback(() => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    const otpData = {
      ...otp,
      issuer: formData.issuer.trim(),
      label: formData.label.trim(),
      period: parseInt(formData.period),
      // Note: We don't update algorithm, digits, or secret in edit mode
      // as these would require re-encryption
    };

    editOtpMutation.mutate(
      { otpID: otp.Id, otp: otpData },
      {
        onSuccess: () => {
          onClose();
          toast.success("OTP updated successfully");
        },
        onError: (error: any) => {
          console.error("Error updating OTP:", error);
          const errorMessage = error.response?.data?.error || "Failed to update OTP";
          toast.error(errorMessage);
        },
      }
    );
  }, [formData, otp, editOtpMutation, onClose, validateForm]);

  const handleClose = useCallback(() => {
    onClose();
    setFormData({
      issuer: otp.Issuer,
      label: otp.Label,
      algorithm: "SHA1",
      digits: "6",
      period: otp.Period.toString(),
    });
    setErrors({});
  }, [onClose, otp]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={handleClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>Edit OTP</span>
          <p className="text-sm text-default-500 font-normal">
            Note: Algorithm, digits, and secret cannot be changed for security reasons
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
          
          {/* Read-only fields for information */}
          <Select
            description="Algorithm cannot be changed for security"
            isDisabled
            label="Algorithm"
            selectedKeys={[formData.algorithm]}
          >
            <SelectItem key="SHA1">SHA1</SelectItem>
            <SelectItem key="SHA256">SHA256</SelectItem>
            <SelectItem key="SHA512">SHA512</SelectItem>
          </Select>
          <Input
            description="Digits cannot be changed for security"
            isDisabled
            label="Digits"
            value={formData.digits}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            isDisabled={editOtpMutation.isPending}
            onPress={handleEditOtp}
          >
            {editOtpMutation.isPending ? "Updating..." : "Update OTP"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
