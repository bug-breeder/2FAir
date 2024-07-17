"use client";
import React, { useEffect } from "react";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./qr-scanner.css";

const QRScanner = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (isOpen) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: 250,
          rememberLastUsedCamera: false,
          showTorchButtonIfSupported: true,
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
          alert(`QR Code detected: ${decodedText}, ${decodedResult}`);
          html5QrcodeScanner.clear();
          onClose();
        },
        (errorMessage) => {
          //   alert(`QR Code no longer in front of camera. ${errorMessage}`);
        }
      );

      return () => {
        html5QrcodeScanner.clear();
      };
    }
  }, [isOpen, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      onOpenChange={onClose}
      className="light text-foreground bg-background"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 py-2">
          Scan QR Code
        </ModalHeader>
        <ModalBody className="px-3 pb-3 pt-0">
          <div className="light text-foreground bg-background" id="qr-reader" />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default QRScanner;
