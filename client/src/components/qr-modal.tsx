import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { MdContentCopy, MdOpenInNew, MdQrCode } from "react-icons/md";

import { buildOtpauthUri } from "../lib/totp";
import { toast } from "../lib/toast";
import { Entry } from "../lib/vault/types";

interface QrModalProps {
  entry: Entry | null;
  onClose: () => void;
}

export function QrModal({ entry, onClose }: QrModalProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => setRevealed(false), [entry]);

  const uri = entry ? buildOtpauthUri(entry) : "";

  return (
    <Modal isOpen={!!entry} placement="center" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {t("qr.title")}
          <span className="text-sm font-normal text-default-500">
            {entry?.issuer}
            {entry?.label ? ` · ${entry.label}` : ""}
          </span>
        </ModalHeader>
        <ModalBody className="items-center gap-4">
          <Alert color="warning" title={t("qr.warning")} />
          <div className="relative rounded-xl bg-white p-4">
            <QRCodeSVG
              className={revealed ? "" : "blur-md"}
              level="M"
              size={224}
              value={
                revealed ? uri : "otpauth://totp/hidden?secret=AAAAAAAAAAAAAAAA"
              }
            />
            {!revealed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  color="primary"
                  radius="full"
                  startContent={<MdQrCode />}
                  onPress={() => setRevealed(true)}
                >
                  {t("qr.reveal")}
                </Button>
              </div>
            )}
          </div>
          {revealed && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                radius="full"
                size="sm"
                startContent={<MdContentCopy />}
                variant="flat"
                onPress={async () => {
                  await navigator.clipboard.writeText(entry?.secret ?? "");
                  toast.success(t("qr.secretCopied"));
                }}
              >
                {t("qr.copySecret")}
              </Button>
              <Button
                as="a"
                href={uri}
                radius="full"
                size="sm"
                startContent={<MdOpenInNew />}
                variant="flat"
              >
                {t("qr.openUri")}
              </Button>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button radius="full" variant="light" onPress={onClose}>
            {t("common.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
