import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import QrScanner from "qr-scanner";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrResult, setQrResult] = useState<string>("None");
  const [qrTimestamp, setQrTimestamp] = useState<string>("");
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [flashState, setFlashState] = useState<boolean>(false);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>("");

  useEffect(() => {
    let qrScanner: QrScanner;

    if (isOpen && videoRef.current) {
      qrScanner = new QrScanner(
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

      qrScanner.start().then(() => {
        qrScanner.hasFlash().then(setHasFlash);
        QrScanner.listCameras(true).then((cameras) => {
          setCameras(cameras);
          if (cameras.length > 0) {
            setCurrentCamera(cameras[0].id);
          }
        });
      });

      return () => {
        qrScanner.stop();
        qrScanner.destroy();
      };
    }
  }, [isOpen]);

  const toggleFlash = () => {
    if (hasFlash && videoRef.current) {
      QrScanner.toggleFlash().then(() => setFlashState((prev) => !prev));
    }
  };

  const switchCamera = (deviceId: string) => {
    setCurrentCamera(deviceId);
    if (videoRef.current) {
      const qrScanner = new QrScanner(videoRef.current, (result) => {
        setQrResult(result.data);
        setQrTimestamp(new Date().toString());
      });
      qrScanner.setCamera(deviceId).then(() => {
        qrScanner.hasFlash().then(setHasFlash);
        qrScanner.start();
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
              <video id="qr-video" ref={videoRef}></video>
            </div>
            <b>Detected QR code: </b>
            <span>{qrResult}</span>
            <br />
            <b>Last detected at: </b>
            <span>{qrTimestamp}</span>
            <br />
            {hasFlash && (
              <Button onPress={toggleFlash}>
                {flashState ? "Turn off Flash" : "Turn on Flash"}
              </Button>
            )}
            <br />
            {cameras.length > 1 && (
              <select
                onChange={(e) => switchCamera(e.target.value)}
                value={currentCamera}
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            )}
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
