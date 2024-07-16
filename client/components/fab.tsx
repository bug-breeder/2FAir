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
import { FaPlus, FaQrcode, FaEdit } from "react-icons/fa";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";

const FAB = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newOtp, setNewOtp] = useState({
    issuer: "",
    label: "",
    secret: "",
    period: 30,
  });

  const handleAddOtp = () => {
    console.log("New OTP:", newOtp);
    onOpenChange();
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleScanQR = () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    html5QrcodeScanner.render(
      (decodedText, decodedResult) => {
        console.log(`QR Code detected: ${decodedText}`, decodedResult);
        html5QrcodeScanner.clear();
      },
      (errorMessage) => {
        console.log(`QR Code no longer in front of camera. ${errorMessage}`);
      }
    );
  };

  return (
    <>
      <div className="fixed bottom-5 sm:bottom-10 right-5 sm:right-10 flex flex-col items-end space-y-4">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center space-x-2"
            >
              <span className="text-sm text-default-500">Scan QR Code</span>
              <Button
                isIconOnly
                size="lg"
                // color="primary"
                variant="shadow"
                className="rounded-full"
                onPress={handleScanQR}
              >
                <FaQrcode />
              </Button>
            </motion.div>
          )}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center space-x-2"
            >
              <span className="text-sm text-default-500">Add Manually</span>
              <Button
                isIconOnly
                size="lg"
                className="rounded-full"
                variant="shadow"
                onPress={onOpen}
              >
                <FaEdit />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          isIconOnly
          size="lg"
          className="rounded-full transition-transform transform hover:rotate-45"
          variant="shadow"
          color="success"
          onPress={toggleExpand}
        >
          <FaPlus className={isExpanded ? "rotate-45" : ""} />
        </Button>
      </div>

      <div id="qr-reader" style={{ display: "none" }}></div>

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
                <Button color="success" onPress={handleAddOtp}>
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
