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
    <Modal isOpen={showQR} placement="center" onClose={closeQR}>
      <ModalContent>
        <div className="p-6 flex justify-center">
          <QRCode
            size={256}
            value={`otpauth://totp/${otp.Issuer}:${otp.Label}?secret=${otp.Secret}&issuer=${otp.Issuer}&algorithm=SHA1&digits=6&period=${otp.Period}`}
          />
        </div>
      </ModalContent>
    </Modal>
  );
};

export default QRModal;
