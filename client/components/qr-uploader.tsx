import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import QrScanner from "qr-scanner";
import { MdFileUpload } from "react-icons/md";

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
          <ModalHeader className="flex flex-col gap-1">
            Upload QR Image
          </ModalHeader>
          <ModalBody>
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
