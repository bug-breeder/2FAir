"use client";
import React from "react";
import { Modal, ModalContent } from "@heroui/react";
import QRCode from "qrcode.react";

interface QRModalProps {
  showQR: boolean;
  closeQR: () => void;
  otp: {
    Issuer: string;
    Label: string;
    Secret: string;
    Period: number;
  };
}

const QRModal: React.FC<QRModalProps> = ({ showQR, closeQR, otp }) => {
  return (
    <Modal isOpen={showQR} onClose={closeQR} placement="center">
      <ModalContent>
        <QRCode
          value={`otpauth://totp/${otp.Issuer}:${otp.Label}?secret=${otp.Secret}&issuer=${otp.Issuer}&algorithm=SHA1&digits=6&period=${otp.Period}`}
        />
      </ModalContent>
    </Modal>
  );
};

export default QRModal;
