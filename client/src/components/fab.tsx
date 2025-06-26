import { useState, useCallback } from "react";
import { Button } from "@heroui/react";
import { FiPlus, FiUpload, FiCamera } from "react-icons/fi";

import { AddOtpModal } from "./add-otp-modal";
import { QrScannerModal } from "./qr-scanner";
import { QRImageUploaderModal } from "./qr-uploader";

export function FAB() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleAddManual = useCallback(() => {
    setShowAddModal(true);
    setIsOpen(false);
  }, []);

  const handleScanQR = useCallback(() => {
    setShowScanner(true);
    setIsOpen(false);
  }, []);

  const handleUploadQR = useCallback(() => {
    setShowUploader(true);
    setIsOpen(false);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleCloseScanner = useCallback(() => {
    setShowScanner(false);
  }, []);

  const handleCloseUploader = useCallback(() => {
    setShowUploader(false);
  }, []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col-reverse items-end gap-3">
          {/* Sub-buttons */}
          {isOpen && (
            <>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                isIconOnly
                radius="full"
                size="md"
                onPress={handleAddManual}
              >
                <FiPlus className="text-white text-xl" />
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600"
                isIconOnly
                radius="full"
                size="md"
                onPress={handleScanQR}
              >
                <FiCamera className="text-white text-xl" />
              </Button>
              <Button
                className="bg-purple-500 hover:bg-purple-600"
                isIconOnly
                radius="full"
                size="md"
                onPress={handleUploadQR}
              >
                <FiUpload className="text-white text-xl" />
              </Button>
            </>
          )}

          {/* Main FAB */}
          <Button
            className={`bg-primary hover:bg-primary-600 transition-transform ${
              isOpen ? "rotate-45" : ""
            }`}
            isIconOnly
            radius="full"
            size="lg"
            onPress={handleToggle}
          >
            <FiPlus className="text-white text-2xl" />
          </Button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={handleToggle}
        />
      )}

      {/* Modals */}
      <AddOtpModal isOpen={showAddModal} onClose={handleCloseAddModal} />
      <QrScannerModal isOpen={showScanner} onClose={handleCloseScanner} />
      <QRImageUploaderModal isOpen={showUploader} onClose={handleCloseUploader} />
    </>
  );
}
