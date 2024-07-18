"use client";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Button,
} from "@nextui-org/react";
import { Html5Qrcode } from "html5-qrcode";
import "./qr-scanner.css";

const QRScanner = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>(
    []
  );
  const [showFileInput, setShowFileInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initScanner = async () => {
        const qrCodeScanner = new Html5Qrcode("qr-reader", { verbose: true });
        setHtml5QrCode(qrCodeScanner);

        try {
          const devices = await Html5Qrcode.getCameras();
          setCameras(devices);
          if (devices && devices.length) {
            const initialCameraId = devices[0].id;
            setCameraId(initialCameraId);
            await qrCodeScanner.start(
              { deviceId: { exact: initialCameraId } },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText, decodedResult) => {
                alert(`QR Code detected: ${decodedText}`);
                stopScanner();
              },
              (errorMessage) => {
                console.log(
                  `QR Code no longer in front of camera. ${errorMessage}`
                );
              }
            );
          }
        } catch (err) {
          console.error("Error starting the scanner:", err);
        }
      };

      initScanner();
    }

    return () => {
      if (html5QrCode) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        });
      }
    };
  }, [isOpen]);

  const switchCamera = async () => {
    if (html5QrCode && cameras.length > 1) {
      const currentIndex = cameras.findIndex((cam) => cam.id === cameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCameraId = cameras[nextIndex].id;
      setCameraId(nextCameraId);

      await html5QrCode.stop();
      await html5QrCode.start(
        { deviceId: { exact: nextCameraId } },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText, decodedResult) => {
          alert(`QR Code detected: ${decodedText}`);
          stopScanner();
        },
        (errorMessage) => {
          console.log(`QR Code no longer in front of camera. ${errorMessage}`);
        }
      );
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && html5QrCode) {
      const file = e.target.files[0];
      try {
        const decodedText = await html5QrCode.scanFile(file, true);
        alert(`QR Code detected: ${decodedText}`);
        stopScanner();
      } catch (err) {
        console.error(`Error scanning file. Reason: ${err}`);
      }
    }
  };

  const stopScanner = () => {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        html5QrCode.clear();
        onClose();
      });
    }
  };

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
          <div className="flex justify-center mt-4 space-x-4">
            <Button onPress={switchCamera}>Switch Camera</Button>
            <Button onPress={() => setShowFileInput(!showFileInput)}>
              Upload Image
            </Button>
          </div>
          {showFileInput && (
            <div className="mt-4">
              <input
                type="file"
                id="qr-input-file"
                accept="image/*"
                capture
                onChange={handleFileInput}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default QRScanner;
