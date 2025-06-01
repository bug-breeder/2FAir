import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@heroui/react";
import { useEditOtp } from "../hooks/otp";
import { OTP } from "../types/otp";
import { toast } from "../lib/toast";

interface EditOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  otp: OTP;
}

const EditOtpModal: React.FC<EditOtpModalProps> = ({ isOpen, onClose, otp }) => {
  const [editedOtp, setEditedOtp] = useState({
    issuer: "",
    label: "",
    period: 30,
    algorithm: "SHA1",
    digits: 6,
    method: "TOTP",
  });

  const editOtpMutation = useEditOtp();

  // Initialize form with current OTP data when modal opens
  useEffect(() => {
    if (isOpen && otp) {
      setEditedOtp({
        issuer: otp.Issuer,
        label: otp.Label,
        period: otp.Period,
        algorithm: "SHA1", // Default since not in OTP type
        digits: 6, // Default since not in OTP type
        method: "TOTP", // Default since not in OTP type
      });
    }
  }, [isOpen, otp]);

  const handleEditOtp = () => {
    // Only include fields that have actually changed
    const otpData: any = {};
    
    // Always include these for the API structure
    otpData.active = true;
    otpData.counter = 0;
    otpData.createdAt = new Date().toISOString();
    
    // Only include changed fields
    if (editedOtp.issuer !== otp.Issuer) {
      otpData.issuer = editedOtp.issuer;
    }
    if (editedOtp.label !== otp.Label) {
      otpData.label = editedOtp.label;
    }
    if (editedOtp.algorithm !== "SHA1") { // Only if not default
      otpData.algorithm = editedOtp.algorithm;
    }
    if (editedOtp.digits !== 6) { // Only if not default
      otpData.digits = editedOtp.digits;
    }
    if (editedOtp.period !== otp.Period) {
      otpData.period = editedOtp.period;
    }
    if (editedOtp.method !== "TOTP") { // Only if not default
      otpData.method = editedOtp.method;
    }

    console.log("Edit OTP - Original OTP:", otp);
    console.log("Edit OTP - Edited data:", editedOtp);
    console.log("Edit OTP - Sending to API (only changed fields):", otpData);
    console.log("Edit OTP - OTP ID:", otp.Id);

    editOtpMutation.mutate(
      { otpID: otp.Id, otp: otpData },
      {
        onSuccess: (response) => {
          console.log("Edit OTP - Success response:", response);
          onClose(); // Close the modal on success
          toast.success("OTP updated successfully");
        },
        onError: (error: any) => {
          console.error("Edit OTP - Error:", error);
          console.error("Edit OTP - Error details:", error.response?.data);
          toast.error("Failed to update OTP");
        },
      }
    );
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setEditedOtp({
      issuer: "",
      label: "",
      period: 30,
      algorithm: "SHA1",
      digits: 6,
      method: "TOTP",
    });
  };

  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={handleClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            <span>Edit OTP</span>
            <p className="text-sm text-default-500 font-normal">
              Note: The secret key cannot be changed for security reasons. To use a different secret, please delete this OTP and add a new one.
            </p>
          </ModalHeader>
          <ModalBody>
            <Input
              label="Issuer"
              placeholder="The service provider, e.g. Google"
              value={editedOtp.issuer}
              onChange={(e) =>
                setEditedOtp({ ...editedOtp, issuer: e.target.value })
              }
            />
            <Input
              label="Label"
              placeholder="The account name or email"
              value={editedOtp.label}
              onChange={(e) =>
                setEditedOtp({ ...editedOtp, label: e.target.value })
              }
            />
            <Input
              label="Period"
              type="number"
              placeholder="30"
              value={editedOtp.period.toString()}
              onChange={(e) =>
                setEditedOtp({ ...editedOtp, period: parseInt(e.target.value) || 30 })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleClose}>
              Cancel
            </Button>
            <Button
              color="success"
              isDisabled={editOtpMutation.isPending}
              onPress={handleEditOtp}
            >
              {editOtpMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default EditOtpModal; 