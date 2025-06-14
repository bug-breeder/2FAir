import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import QrScanner from "qr-scanner";

import { useAddOtp } from "../hooks/otp";

interface QRImageUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRImageUploaderModal: React.FC<QRImageUploaderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [qrResult, setQrResult] = useState<string>("None");
  const [qrTimestamp, setQrTimestamp] = useState<string>("");
  const addOtpMutation = useAddOtp();

  const handleQrCodeScan = (data: string) => {
    try {
      if (data.startsWith("otpauth://totp/")) {
        const url = new URL(data);
        const issuer = url.searchParams.get("issuer") || "";
        const label = url.pathname.split(":")[1];
        const secret = url.searchParams.get("secret") || "";
        const period = parseInt(url.searchParams.get("period") || "30", 10);

        const otpData = {
          active: true,
          algorithm: "SHA1",
          counter: 0,
          createdAt: new Date().toISOString(),
          digits: 6,
          label: label,
          issuer: issuer,
          method: "TOTP",
          period: period,
          secret: secret,
        };

        // Add the OTP using the mutation
        addOtpMutation.mutate(otpData, {
          onSuccess: () => {
            onClose(); // Close the modal on success
          },
          onError: (error) => {
            console.error("Error adding OTP:", error);
          },
        });
      } else {
        console.error("Invalid OTP QR Code format.");
      }
    } catch (error) {
      console.error("Error parsing OTP QR Code:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      QrScanner.scanImage(file)
        .then((result) => {
          setQrResult(result);
          setQrTimestamp(new Date().toString());
          handleQrCodeScan(result);
        })
        .catch((error) => {
          setQrResult("No QR code found.");
          setQrTimestamp(new Date().toString());
        });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];

    if (file) {
      QrScanner.scanImage(file)
        .then((result) => {
          setQrResult(result);
          setQrTimestamp(new Date().toString());
          handleQrCodeScan(result);
        })
        .catch((error) => {
          setQrResult("No QR code found.");
          setQrTimestamp(new Date().toString());
        });
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            Upload QR Image
          </ModalHeader>
          <ModalBody>
            <div
              style={{
                width: "100%",
                height: "300px",
                border: "2px dashed #ccc",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                borderRadius: "8px",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                accept="image/*"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                }}
                type="file"
                onChange={handleFileChange}
              />
              <p className="text-center text-default-500">
                Drag & drop an image here, or click to select a file
              </p>
            </div>
            <div style={{ marginTop: "10px" }}>
              <b>Detected QR code: </b>
              <span>{qrResult}</span>
              <br />
              <b>Last detected at: </b>
              <span>{qrTimestamp}</span>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default QRImageUploaderModal;
