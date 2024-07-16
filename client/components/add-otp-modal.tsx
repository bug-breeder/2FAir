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
} from "@nextui-org/react";

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

  const handleAddOtp = () => {
    console.log("New OTP:", newOtp);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
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
            <Button color="success" onPress={handleAddOtp}>
              Add OTP
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AddOtpModal;
