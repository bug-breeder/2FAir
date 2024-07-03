"use client";
import React from "react";
import { Modal, ModalContent } from "@nextui-org/react";
import QRCode from "qrcode.react";

interface QRModalProps {
  showQR: boolean;
  closeQR: () => void;
  otp: {
    issuer: string;
    label: string;
    secret: string;
    period: number;
  };
}

const QRModal: React.FC<QRModalProps> = ({ showQR, closeQR, otp }) => {
  return (
    <Modal isOpen={showQR} onClose={closeQR}>
      <ModalContent>
        <QRCode
          value={`otpauth://totp/${otp.issuer}:${otp.label}?secret=${otp.secret}&issuer=${otp.issuer}&algorithm=SHA1&digits=6&period=${otp.period}`}
        />
      </ModalContent>
    </Modal>
  );
};

export default QRModal;
