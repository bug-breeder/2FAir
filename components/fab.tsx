"use client";
import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
} from "@nextui-org/react";
import { FaPlus } from "react-icons/fa";

const FAB = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [newOtp, setNewOtp] = useState({
    issuer: "",
    label: "",
    secret: "",
    period: 30,
  });

  const handleAddOtp = () => {
    // Handle OTP addition logic, e.g., update the database
    console.log("New OTP:", newOtp);
    onOpenChange(); // Close the modal
  };

  return (
    <>
      <Button
        isIconOnly
        size="lg"
        className="fixed bottom-5 sm:bottom-10 right-5 sm:right-10 rounded-full"
        variant="shadow"
        onPress={onOpen}
      >
        <FaPlus />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add OTP</ModalHeader>
              <ModalBody>
                <Input
                  label="Issuer"
                  placeholder="Issuer"
                  onChange={(e) =>
                    setNewOtp({ ...newOtp, issuer: e.target.value })
                  }
                />
                <Input
                  label="Label"
                  placeholder="Label"
                  onChange={(e) =>
                    setNewOtp({ ...newOtp, label: e.target.value })
                  }
                />
                <Input
                  label="Secret"
                  placeholder="Secret"
                  onChange={(e) =>
                    setNewOtp({ ...newOtp, secret: e.target.value })
                  }
                />
                <Input
                  label="Period"
                  placeholder="Period"
                  type="number"
                  onChange={(e) =>
                    setNewOtp({ ...newOtp, period: Number(e.target.value) })
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={handleAddOtp}>
                  Add OTP
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default FAB;
