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
import { MdCameraswitch, MdFlashlightOn } from "react-icons/md";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

export function QrScannerModal({
  isOpen,
  onClose,
  onResult,
}: QrScannerModalProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const onResultRef = useRef(onResult);
  const [hasFlash, setHasFlash] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [facingMode, setFacingMode] =
    useState<QrScanner.FacingMode>("environment");

  onResultRef.current = onResult;

  useEffect(() => {
    if (!isOpen) return;

    // The modal content mounts after open; wait a frame for the <video>.
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled || !videoRef.current) return;

      let handled = false;
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (handled) return;
          handled = true;
          scanner.stop();
          onResultRef.current(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
        },
      );

      scannerRef.current = scanner;
      setCameraError(false);
      setFacingMode("environment");
      scanner
        .start()
        .then(() => scanner.hasFlash().then(setHasFlash))
        .catch(() => setCameraError(true));
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [isOpen]);

  const switchCamera = async () => {
    const scanner = scannerRef.current;

    if (!scanner) return;
    const next = facingMode === "environment" ? "user" : "environment";

    await scanner.setCamera(next);
    setFacingMode(next);
    setHasFlash(await scanner.hasFlash());
  };

  return (
    <Modal isOpen={isOpen} placement="center" size="lg" onClose={onClose}>
      <ModalContent>
        <ModalHeader>{t("scan.title")}</ModalHeader>
        <ModalBody>
          <div className="relative overflow-hidden rounded-xl bg-black">
            {}
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-square w-full object-cover"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              {hasFlash && (
                <Button
                  isIconOnly
                  aria-label={t("scan.flash")}
                  radius="full"
                  onPress={() => scannerRef.current?.toggleFlash()}
                >
                  <MdFlashlightOn className="text-xl" />
                </Button>
              )}
              <Button
                isIconOnly
                aria-label={t("scan.switchCamera")}
                radius="full"
                onPress={switchCamera}
              >
                <MdCameraswitch className="text-xl" />
              </Button>
            </div>
          </div>
          <p
            className={`text-center text-sm ${cameraError ? "text-danger" : "text-default-500"}`}
          >
            {cameraError ? t("scan.cameraError") : t("scan.hint")}
          </p>
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
