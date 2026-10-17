import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useTranslation } from "react-i18next";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} placement="center" onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="text-default-600">{body}</p>
        </ModalBody>
        <ModalFooter>
          <Button radius="full" variant="light" onPress={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            color="danger"
            isLoading={busy}
            radius="full"
            onPress={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
