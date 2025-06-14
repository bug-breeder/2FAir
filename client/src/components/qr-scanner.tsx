import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import QrScanner from "qr-scanner";
import { MdCameraswitch, MdOutlineFlashOn } from "react-icons/md";

import { useAddOtp } from "../hooks/otp";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [qrResult, setQrResult] = useState<string>("None");
  const [qrTimestamp, setQrTimestamp] = useState<string>("");
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [currentFacingMode, setCurrentFacingMode] =
    useState<QrScanner.FacingMode>("environment");

  const addOtpMutation = useAddOtp();

  useEffect(() => {
    if (isOpen && videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setQrResult(result.data);
          setQrTimestamp(new Date().toString());
          handleQrCodeScan(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        },
      );

      qrScannerRef.current.start().then(() => {
        qrScannerRef.current?.hasFlash().then(setHasFlash);
      });

      return () => {
        qrScannerRef.current?.stop();
        qrScannerRef.current?.destroy();
      };
    }
  }, [isOpen]);

  const toggleFlash = () => {
    if (isFlashOn) {
      qrScannerRef.current?.turnFlashOff().then(() => {
        setIsFlashOn(false);
      });
    } else {
      qrScannerRef.current?.turnFlashOn().then(() => {
        setIsFlashOn(true);
      });
    }
  };

  const switchCamera = () => {
    const newFacingMode =
      currentFacingMode === "environment" ? "user" : "environment";

    qrScannerRef.current?.setCamera(newFacingMode).then(() => {
      setCurrentFacingMode(newFacingMode);
      qrScannerRef.current?.hasFlash().then(setHasFlash);
    });
  };

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
          algorithm: "SHA1", // Assuming SHA1 is the default algorithm
          counter: 0, // Assuming it's a TOTP, so counter is not used
          createdAt: new Date().toISOString(),
          digits: 6, // Assuming 6 digits is standard
          label: label,
          issuer: issuer,
          method: "TOTP", // Assuming method is TOTP
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
            // Handle error accordingly, e.g., show a notification
          },
        });
      } else {
        console.error("Invalid OTP QR Code format.");
      }
    } catch (error) {
      console.error("Error parsing OTP QR Code:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">QR Scanner</ModalHeader>
          <ModalBody>
            <div id="video-container" style={{ position: "relative" }}>
              <video ref={videoRef} id="qr-video" style={{ width: "100%" }}>
                <track kind="captions" />
              </video>
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
                }}
              >
                {hasFlash && (
                  <Button
                    isIconOnly
                    aria-label="Toggle Flash"
                    color="warning"
                    onPress={toggleFlash}
                  >
                    <MdOutlineFlashOn />
                  </Button>
                )}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                }}
              >
                <Button
                  isIconOnly
                  aria-label="Switch Camera"
                  color="primary"
                  onPress={switchCamera}
                >
                  <MdCameraswitch />
                </Button>
              </div>
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

export default QrScannerModal;
