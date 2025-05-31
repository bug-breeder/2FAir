"use client";
import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@heroui/react";
import { useAddOtp, useListOtps } from "@/hooks/otp"; // Ensure these paths are correct

const AddOtpModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [newOtp, setNewOtp] = useState({
    issuer: "",
    label: "",
    secret: "",
    period: 30,
  });

  const addOtpMutation = useAddOtp();
  const { refetch } = useListOtps(); // Hook to refetch the OTP list

  const handleAddOtp = () => {
    const otpData = {
      active: true,
      algorithm: "SHA1", // Assuming SHA1 is the default algorithm
      counter: 0, // Assuming it's a TOTP, so counter is not used
      createdAt: new Date().toISOString(),
      digits: 6, // Assuming 6 digits is standard
      label: newOtp.label,
      issuer: newOtp.issuer,
      method: "TOTP", // Assuming method is TOTP
      period: newOtp.period,
      secret: newOtp.secret,
    };

    addOtpMutation.mutate(otpData, {
      onSuccess: () => {
        refetch(); // Refetch the OTP list
        onClose(); // Close the modal on success
      },
      onError: (error) => {
        console.error("Error adding OTP:", error);
        // Handle error accordingly, e.g., show a notification
      },
    });
  };

  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={onClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">Add OTP</ModalHeader>
          <ModalBody>
            <Input
              label="Issuer"
              placeholder="The service provider, e.g. Google"
              onChange={(e) => setNewOtp({ ...newOtp, issuer: e.target.value })}
            />
            <Input
              label="Label"
              placeholder="The account name or email"
              onChange={(e) => setNewOtp({ ...newOtp, label: e.target.value })}
            />
            <Input
              label="Secret"
              placeholder="The secret key, e.g. NB2W45DFOIZA"
              onChange={(e) => setNewOtp({ ...newOtp, secret: e.target.value })}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
            <Button
              color="success"
              isDisabled={addOtpMutation.isLoading}
              onPress={handleAddOtp}
            >
              {addOtpMutation.isLoading ? "Adding..." : "Add OTP"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AddOtpModal;
