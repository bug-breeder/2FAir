import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { IoFlash } from "react-icons/io5";
import { LuSwitchCamera } from "react-icons/lu";
import QrScanner from "qr-scanner";

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
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setQrResult(result.data);
          setQrTimestamp(new Date().toString());
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current.start().then(() => {
        qrScannerRef.current?.hasFlash().then(setHasFlash);
        QrScanner.listCameras(true).then(setCameras);
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
    if (cameras.length > 0) {
      const nextCameraIndex = (currentCameraIndex + 1) % cameras.length;
      const nextCamera = cameras[nextCameraIndex];
      qrScannerRef.current?.setCamera(nextCamera.id).then(() => {
        setCurrentCameraIndex(nextCameraIndex);
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">QR Scanner</ModalHeader>
          <ModalBody>
            <div id="video-container">
              <video id="qr-video" ref={videoRef}>
                <track kind="captions" />
              </video>
            </div>
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {hasFlash && (
                <Button
                  isIconOnly
                  color="warning"
                  onPress={toggleFlash}
                  aria-label="Toggle Flash"
                >
                  <IoFlash />
                </Button>
              )}
              <Button
                isIconOnly
                color="primary"
                onPress={switchCamera}
                aria-label="Switch Camera"
              >
                <LuSwitchCamera />
              </Button>
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
            <Button color="primary" onPress={onClose}>
              OK
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default QrScannerModal;
