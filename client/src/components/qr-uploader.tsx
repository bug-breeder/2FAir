import { useEffect, useRef, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import QrScanner from "qr-scanner";
import { useTranslation } from "react-i18next";
import { FiUpload } from "react-icons/fi";

import { toast } from "../lib/toast";

interface QrUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

export function QrUploaderModal({
  isOpen,
  onClose,
  onResult,
}: QrUploaderModalProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const scan = async (file: File | undefined | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setProcessing(true);
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });

      onResult(result.data);
    } catch {
      toast.error(t("scan.noQr"));
    } finally {
      setProcessing(false);
    }
  };

  // Paste a screenshot straight from the clipboard.
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );

      if (file) void scan(file);
    };

    window.addEventListener("paste", onPaste);

    return () => window.removeEventListener("paste", onPaste);
  });

  return (
    <Modal isOpen={isOpen} placement="center" onClose={onClose}>
      <ModalContent>
        <ModalHeader>{t("scan.uploadTitle")}</ModalHeader>
        <ModalBody>
          <button
            className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragActive
                ? "border-secondary-600 bg-secondary-50"
                : "border-default-300 hover:border-default-400"
            }`}
            disabled={processing}
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              void scan(e.dataTransfer.files[0]);
            }}
          >
            <FiUpload className="text-4xl text-default-400" />
            <span className="font-medium">
              {processing ? t("scan.processing") : t("scan.drop")}
            </span>
            <span className="text-xs text-default-500">
              {t("scan.formats")}
            </span>
          </button>
          <input
            ref={inputRef}
            accept="image/*"
            className="hidden"
            type="file"
            onChange={(e) => {
              void scan(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button radius="full" variant="light" onPress={onClose}>
            {t("common.cancel")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
