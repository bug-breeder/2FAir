
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/react";
import QRCode from "qrcode.react";

import { OTP } from "../types/otp";

interface QRModalProps {
  showQR: boolean;
  closeQR: () => void;
  otp: OTP;
}

export function QRModal({ showQR, closeQR, otp }: QRModalProps) {
  const otpAuthUrl = `otpauth://totp/${encodeURIComponent(otp.Label)}?secret=${otp.Secret}&issuer=${encodeURIComponent(otp.Issuer)}&algorithm=SHA1&digits=6&period=${otp.Period}`;

  return (
    <Modal isOpen={showQR} placement="center" onOpenChange={closeQR}>
      <ModalContent>
        <ModalHeader>QR Code - {otp.Issuer}</ModalHeader>
        <ModalBody className="items-center pb-6">
          <QRCode
            size={256}
            value={otpAuthUrl}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
