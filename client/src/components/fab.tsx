import React, { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { FaPlus, FaEdit } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { LuFileImage, LuCamera } from "react-icons/lu";
import AddOtpModal from "./add-otp-modal";
import QrScannerModal from "./qr-scanner";
import QRImageUploaderModal from "./qr-uploader";

const FAB = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRUploader, setShowQRUploader] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const closeExpand = () => setIsExpanded(false);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10"
            onClick={closeExpand}
          />
        )}
      </AnimatePresence>
      <div className="fixed bottom-5 sm:bottom-10 right-5 sm:right-10 flex flex-col items-end space-y-4 z-20">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center space-x-2"
            >
              <Chip
                className="text-sm text-default-500"
                variant="solid"
                radius="sm"
              >
                Scan QR Code
              </Chip>
              <Button
                isIconOnly
                size="lg"
                variant="shadow"
                className="rounded-full w-14 h-14"
                onPress={() => {
                  setShowQRScanner(true);
                  closeExpand();
                }}
              >
                <LuCamera />
              </Button>
            </motion.div>
          )}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center space-x-2"
            >
              <Chip
                className="text-sm text-default-500"
                variant="solid"
                radius="sm"
              >
                Read QR Image
              </Chip>
              <Button
                isIconOnly
                size="lg"
                variant="shadow"
                className="rounded-full w-14 h-14"
                onPress={() => {
                  setShowQRUploader(true);
                  closeExpand();
                }}
              >
                <LuFileImage />
              </Button>
            </motion.div>
          )}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center space-x-2"
            >
              <Chip
                className="text-sm text-default-500"
                variant="solid"
                radius="sm"
              >
                Add Manually
              </Chip>
              <Button
                isIconOnly
                size="lg"
                className="rounded-full w-14 h-14"
                variant="shadow"
                onPress={() => {
                  setShowModal(true);
                  closeExpand();
                }}
              >
                <FaEdit />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          isIconOnly
          size="lg"
          className="rounded-full w-14 h-14"
          variant="shadow"
          color="success"
          onPress={toggleExpand}
        >
          <FaPlus className={isExpanded ? "rotate-45" : ""} />
        </Button>
      </div>

      <QrScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
      />
      <QRImageUploaderModal
        isOpen={showQRUploader}
        onClose={() => setShowQRUploader(false)}
      />
      <AddOtpModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default FAB; 