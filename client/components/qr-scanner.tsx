"use client";
import React, { useEffect } from "react";
import { Modal, ModalContent } from "@nextui-org/react";
import { Html5QrcodeScanner } from "html5-qrcode";

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
        { fps: 10, qrbox: 250 },
        false
      );

      html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
          alert(`QR Code detected: ${decodedText}, ${decodedResult}`);
          html5QrcodeScanner.clear();
          onClose();
        },
        (errorMessage) => {
          alert(`QR Code no longer in front of camera. ${errorMessage}`);
        }
      );

      return () => {
        html5QrcodeScanner.clear();
      };
    }
  }, [isOpen, onClose]);

  return <div id="qr-reader" style={{ width: "100%" }} />;
};

export default QRScanner;
