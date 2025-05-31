import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from "@heroui/react";
import { MdDeleteSweep, MdQrCode } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { useMediaQuery } from "@react-hook/media-query";

import { useInactivateOtp } from "../hooks/otp";
import { toast } from "../lib/toast";

interface ContextMenuProps {
  activeMenu: { idx: number; x: number; y: number } | null;
  closeMenu: () => void;
  setShowQR: (show: boolean) => void;
  setShowEdit: (show: boolean) => void;
  otpID: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  activeMenu,
  closeMenu,
  setShowQR,
  setShowEdit,
  otpID,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const inactivateOtpMutation = useInactivateOtp();

  const handleDelete = () => {
    inactivateOtpMutation.mutate(otpID, {
      onSuccess: () => {
        closeMenu();
        toast.success("OTP deleted successfully");
      },
      onError: (error) => {
        console.error("Error deleting OTP:", error);
        toast.error("Failed to delete OTP");
      },
    });
  };

  const handleEdit = () => {
    setShowEdit(true);
    closeMenu();
  };

  const handleShowQR = () => {
    setShowQR(true);
    closeMenu();
  };

  const handleAction = (key: React.Key) => {
    switch (key) {
      case "qr":
        handleShowQR();
        break;
      case "edit":
        handleEdit();
        break;
      case "delete":
        handleDelete();
        break;
    }
  };

  if (isMobile) {
    return (
      <Modal isOpen={true} onClose={closeMenu} placement="bottom-center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Actions</ModalHeader>
          <ModalBody className="gap-4 mb-6">
            <Button
              onPress={handleShowQR}
              variant="flat"
              startContent={<MdQrCode className="text-2xl" />}
            >
              Show QR code
            </Button>
            <Button
              startContent={<FaEdit />}
              variant="flat"
              onPress={handleEdit}
            >
              Edit
            </Button>
            <Button
              className="text-danger"
              isDisabled={inactivateOtpMutation.isPending}
              startContent={<MdDeleteSweep className="text-2xl text-danger" />}
              variant="flat"
              onPress={handleDelete}
            >
              {inactivateOtpMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Dropdown isOpen={true} onOpenChange={(open) => !open && closeMenu()}>
      <DropdownTrigger>
        {activeMenu && (
          <div
            style={{
              position: "absolute",
              top: activeMenu.y,
              left: activeMenu.x,
              width: 0,
              height: 0,
            }}
          />
        )}
      </DropdownTrigger>
      <DropdownMenu aria-label="Actions" onAction={handleAction}>
        <DropdownItem
          key="qr"
          className="text-xl"
          startContent={<MdQrCode className="text-2xl" />}
        >
          <span className="text-lg lg:text-sm">Show QR code</span>
        </DropdownItem>
        <DropdownItem
          key="edit"
          className="text-xl"
          startContent={<FaEdit />}
        >
          <span className="text-lg lg:text-sm">Edit</span>
        </DropdownItem>
        <DropdownItem
          key="delete"
          className="text-danger"
          startContent={<MdDeleteSweep className="text-2xl text-danger" />}
          isDisabled={inactivateOtpMutation.isPending}
        >
          <span className="text-lg lg:text-sm text-danger">
            {inactivateOtpMutation.isPending ? "Deleting..." : "Delete"}
          </span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default ContextMenu; 