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
import { MdCameraswitch, MdOutlineFlashOn } from "react-icons/md";

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

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">QR Scanner</ModalHeader>
          <ModalBody>
            <div id="video-container" style={{ position: "relative" }}>
              <video id="qr-video" ref={videoRef} style={{ width: "100%" }}>
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
                    color="warning"
                    onPress={toggleFlash}
                    aria-label="Toggle Flash"
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
                  color="primary"
                  onPress={switchCamera}
                  aria-label="Switch Camera"
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
