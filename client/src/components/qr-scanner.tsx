import { useState, useRef, useEffect, useCallback } from "react";
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

import { toast } from "../lib/toast";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QrScannerModal({ isOpen, onClose }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [currentFacingMode, setCurrentFacingMode] =
    useState<QrScanner.FacingMode>("environment");

  const parseOTPAuth = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);

      if (urlObj.protocol !== "otpauth:") {
        throw new Error("Not an OTP Auth URL");
      }

      const type = urlObj.host;

      if (type !== "totp") {
        throw new Error("Only TOTP is supported");
      }

      const pathParts = urlObj.pathname.split("/");
      const label = decodeURIComponent(pathParts[1] || "");

      const params = new URLSearchParams(urlObj.search);
      const secret = params.get("secret");
      const issuer = params.get("issuer") || label.split(":")[0] || "Unknown";
      const algorithm = params.get("algorithm") || "SHA1";
      const digits = params.get("digits") || "6";
      const period = params.get("period") || "30";

      if (!secret) {
        throw new Error("Secret is required");
      }

      return {
        secret,
        issuer,
        label: label.includes(":") ? label.split(":")[1] : label,
        algorithm,
        digits,
        period,
      };
    } catch (error) {
      console.error("Failed to parse OTP Auth URL:", error);
      throw error;
    }
  }, []);

  const handleQrCodeScan = useCallback(
    (data: string) => {
      try {
        const otpData = parseOTPAuth(data);

        toast.success(`QR code scanned: ${otpData.issuer}`);

        // Here you would typically open the add OTP modal with pre-filled data
        // For now, we'll just show a success message and close

        onClose();
      } catch (error) {
        console.error("Error parsing OTP QR Code:", error);
        toast.error(
          `Invalid QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [parseOTPAuth, onClose],
  );

  const toggleFlash = useCallback(() => {
    if (qrScannerRef.current) {
      if (isFlashOn) {
        qrScannerRef.current.turnFlashOff().then(() => {
          setIsFlashOn(false);
        });
      } else {
        qrScannerRef.current.turnFlashOn().then(() => {
          setIsFlashOn(true);
        });
      }
    }
  }, [isFlashOn]);

  const switchCamera = useCallback(() => {
    if (qrScannerRef.current) {
      const newFacingMode =
        currentFacingMode === "environment" ? "user" : "environment";

      qrScannerRef.current.setCamera(newFacingMode).then(() => {
        setCurrentFacingMode(newFacingMode);
        qrScannerRef.current?.hasFlash().then(setHasFlash);
      });
    }
  }, [currentFacingMode]);

  const stopScanner = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          handleQrCodeScan(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        },
      );

      qrScannerRef.current
        .start()
        .then(() => {
          qrScannerRef.current?.hasFlash().then(setHasFlash);
        })
        .catch((error) => {
          console.error("Error starting QR scanner:", error);
          toast.error("Failed to start camera. Please check permissions.");
        });

      return () => {
        stopScanner();
      };
    }
  }, [isOpen, handleQrCodeScan, stopScanner]);

  return (
    <Modal isOpen={isOpen} size="lg" onOpenChange={handleClose}>
      <ModalContent>
        <ModalHeader>Scan QR Code</ModalHeader>
        <ModalBody>
          <div id="video-container" style={{ position: "relative" }}>
            <video
              ref={videoRef}
              id="qr-video"
              style={{ width: "100%", borderRadius: "8px" }}
            >
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
          <div className="mt-4 text-center">
            <p className="text-sm text-default-500">
              Point your camera at a QR code to scan
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
