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

  useEffect(() => {
    if (isOpen && videoRef.current) {
      const qrScanner = new QrScanner(
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

      qrScanner.start();

      return () => {
        qrScanner.stop();
        qrScanner.destroy();
      };
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">QR Scanner</ModalHeader>
          <ModalBody>
            <div id="video-container">
              <video ref={videoRef} id="qr-video">
                <track kind="captions" />
              </video>
            </div>
            <b>Detected QR code: </b>
            <span>{qrResult}</span>
            <br />
            <b>Last detected at: </b>
            <span>{qrTimestamp}</span>
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
