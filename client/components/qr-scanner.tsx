"use client";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Button,
} from "@nextui-org/react";
import QrScanner from "qr-scanner";
import "./qr-scanner.css";

const QRScanner = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>(
    []
  );
  const [showFileInput, setShowFileInput] = useState(false);
  const [flashAvailable, setFlashAvailable] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    const videoElem = document.getElementById("qr-video") as HTMLVideoElement;

    if (isOpen) {
      const initScanner = async () => {
        const qrCodeScanner = new QrScanner(
          videoElem,
          (result) => {
            alert(`QR Code detected: ${result.data}`);
            stopScanner();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
        setQrScanner(qrCodeScanner);

        try {
          const devices = await QrScanner.listCameras(true);
          setCameras(devices);
          if (devices && devices.length) {
            const initialCameraId = devices[0].id;
            setCameraId(initialCameraId);
            await qrCodeScanner.setCamera(initialCameraId);
            await qrCodeScanner.start();
          }
        } catch (err) {
          console.error("Error starting the scanner:", err);
        }
      };

      initScanner();
    }

    return () => {
      if (qrScanner) {
        qrScanner.stop();
        qrScanner.destroy();
      }
    };
  }, [isOpen]);

  const switchCamera = async () => {
    try {
      if (qrScanner && cameras.length > 1) {
        const currentIndex = cameras.findIndex((cam) => cam.id === cameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        const nextCameraId = cameras[nextIndex].id;

        setCameraId(nextCameraId);

        await qrScanner.setCamera(nextCameraId);
        await qrScanner.start();
      }
    } catch (err) {
      console.error("Error switching the camera:", err);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && qrScanner) {
      const file = e.target.files[0];

      try {
        const result = await QrScanner.scanImage(file, {
          returnDetailedScanResult: true,
        });
        alert(`QR Code detected: ${result.data}`);
        stopScanner();
      } catch (err) {
        console.error(`Error scanning file. Reason: ${err}`);
      }
    }
  };

  const toggleFlash = async () => {
    if (qrScanner) {
      try {
        await qrScanner.toggleFlash();
        setFlashOn(qrScanner.isFlashOn());
      } catch (err) {
        console.error("Error toggling flash:", err);
      }
    }
  };

  const stopScanner = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 py-2">
          Scan QR Code
        </ModalHeader>
        <ModalBody className="px-3 pb-3 pt-0">
          <div id="video-container">
            <video id="qr-video">
              <track kind="captions" />
            </video>
          </div>
          <div className="flex justify-center mt-4 space-x-4">
            <Button onPress={switchCamera}>Switch Camera</Button>
            <Button onPress={() => setShowFileInput(!showFileInput)}>
              Upload Image
            </Button>
            {flashAvailable && (
              <Button onPress={toggleFlash}>
                Flash: {flashOn ? "On" : "Off"}
              </Button>
            )}
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
