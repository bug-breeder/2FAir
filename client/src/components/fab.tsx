import { useState, useCallback } from "react";
import { Button, Chip } from "@heroui/react";
import { FaPlus, FaEdit } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { LuFileImage, LuCamera } from "react-icons/lu";

import { AddOtpModal } from "./add-otp-modal";
import { QrScannerModal } from "./qr-scanner";
import { QRImageUploaderModal } from "./qr-uploader";

export function FAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRUploader, setShowQRUploader] = useState(false);

  const toggleExpand = useCallback(
    () => setIsExpanded(!isExpanded),
    [isExpanded],
  );
  const closeExpand = useCallback(() => setIsExpanded(false), []);

  const handleAddManual = useCallback(() => {
    setShowModal(true);
    closeExpand();
  }, [closeExpand]);

  const handleScanQR = useCallback(() => {
    setShowQRScanner(true);
    closeExpand();
  }, [closeExpand]);

  const handleUploadQR = useCallback(() => {
    setShowQRUploader(true);
    closeExpand();
  }, [closeExpand]);

  const handleCloseModal = useCallback(() => setShowModal(false), []);
  const handleCloseScanner = useCallback(() => setShowQRScanner(false), []);
  const handleCloseUploader = useCallback(() => setShowQRUploader(false), []);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            animate={{ opacity: 0.5 }}
            className="fixed inset-0 z-10"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={closeExpand}
          />
        )}
      </AnimatePresence>
      <div className="fixed bottom-5 sm:bottom-10 right-5 sm:right-10 flex flex-col items-end space-y-4 z-20">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2"
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
            >
              <Chip
                className="text-sm text-default-500"
                radius="sm"
                variant="solid"
              >
                Scan QR Code
              </Chip>
              <Button
                isIconOnly
                className="rounded-full w-14 h-14"
                size="lg"
                variant="shadow"
                onPress={handleScanQR}
              >
                <LuCamera />
              </Button>
            </motion.div>
          )}
          {isExpanded && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2"
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
            >
              <Chip
                className="text-sm text-default-500"
                radius="sm"
                variant="solid"
              >
                Read QR Image
              </Chip>
              <Button
                isIconOnly
                className="rounded-full w-14 h-14"
                size="lg"
                variant="shadow"
                onPress={handleUploadQR}
              >
                <LuFileImage />
              </Button>
            </motion.div>
          )}
          {isExpanded && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2"
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
            >
              <Chip
                className="text-sm text-default-500"
                radius="sm"
                variant="solid"
              >
                Add Manually
              </Chip>
              <Button
                isIconOnly
                className="rounded-full w-14 h-14"
                size="lg"
                variant="shadow"
                onPress={handleAddManual}
              >
                <FaEdit />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          isIconOnly
          className="rounded-full w-14 h-14"
          color="success"
          size="lg"
          variant="shadow"
          onPress={toggleExpand}
        >
          <FaPlus className={isExpanded ? "rotate-45" : ""} />
        </Button>
      </div>

      <QrScannerModal isOpen={showQRScanner} onClose={handleCloseScanner} />
      <QRImageUploaderModal
        isOpen={showQRUploader}
        onClose={handleCloseUploader}
      />
      <AddOtpModal isOpen={showModal} onClose={handleCloseModal} />
    </>
  );
}
