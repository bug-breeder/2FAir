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
import { MdCameraswitch, MdOutlineFlashOn, MdFileUpload } from "react-icons/md";

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
  const [isUploadMode, setIsUploadMode] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && !isUploadMode && videoRef.current) {
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
  }, [isOpen, isUploadMode]);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      QrScanner.scanImage(file)
        .then((result) => {
          setQrResult(result);
          setQrTimestamp(new Date().toString());
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
          <ModalHeader className="flex flex-col gap-1">QR Scanner</ModalHeader>
          <ModalBody>
            {isUploadMode ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  width: "100%",
                  height: "300px",
                  border: "2px dashed #ccc",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
                <p>Drag & drop an image here, or click to select a file</p>
              </div>
            ) : (
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
            )}
            <div style={{ marginTop: "10px" }}>
              <b>Detected QR code: </b>
              <span>{qrResult}</span>
              <br />
              <b>Last detected at: </b>
              <span>{qrTimestamp}</span>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => setIsUploadMode((prev) => !prev)}
              color="secondary"
              variant="light"
            >
              {isUploadMode ? "Switch to Camera" : "Upload Image"}
            </Button>
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
