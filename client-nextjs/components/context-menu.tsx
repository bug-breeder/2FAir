"use client";
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

import { useInactivateOtp } from "@/hooks/otp"; // Ensure the correct path

interface ContextMenuProps {
  activeMenu: { idx: number; x: number; y: number } | null;
  closeMenu: () => void;
  setShowQR: (show: boolean) => void;
  otpID: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  activeMenu,
  closeMenu,
  setShowQR,
  otpID,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const inactivateOtpMutation = useInactivateOtp();

  const handleDelete = () => {
    inactivateOtpMutation.mutate(otpID, {
      onSuccess: () => {
        closeMenu();
        // Optionally, you could display a notification or confirmation
      },
      onError: (error) => {
        console.error("Error deleting OTP:", error);
        // Handle the error, e.g., show a notification
      },
    });
  };

  if (isMobile) {
    return (
      <Modal isOpen={true} onClose={closeMenu} placement="bottom-center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Actions</ModalHeader>
          <ModalBody className="gap-4 mb-6">
            <Button
              onPress={() => {
                setShowQR(true);
                closeMenu();
              }}
              variant="flat"
              startContent={<MdQrCode className="text-2xl" />}
            >
              Show QR code
            </Button>
            <Button
              startContent={<FaEdit />}
              variant="flat"
              onPress={() => {
                alert("Edit");
                closeMenu();
              }}
            >
              Edit
            </Button>
            <Button
              className="text-danger"
              isDisabled={inactivateOtpMutation.isLoading} // Disable button while loading
              startContent={<MdDeleteSweep className="text-2xl text-danger" />}
              variant="flat"
              onPress={handleDelete}
            >
              {inactivateOtpMutation.isLoading ? "Deleting..." : "Delete"}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Dropdown isOpen={true} onClose={closeMenu}>
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
      <DropdownMenu aria-label="Actions">
        <DropdownItem
          key="qr"
          className="text-xl"
          startContent={<MdQrCode className="text-2xl" />}
          onClick={(event) => {
            event.stopPropagation();
            setShowQR(true);
          }}
        >
          <span className="text-lg lg:text-sm">Show QR code</span>
        </DropdownItem>
        <DropdownItem
          key="edit"
          onClick={(event) => {
            event.stopPropagation();
            alert("Edit");
          }}
          className="text-xl"
          startContent={<FaEdit />}
        >
          <span className="text-lg lg:text-sm">Edit</span>
        </DropdownItem>
        <DropdownItem
          key="delete"
          className="text-danger"
          startContent={<MdDeleteSweep className="text-2xl text-danger" />}
          onClick={(event) => {
            event.stopPropagation();
            handleDelete();
          }}
          isDisabled={inactivateOtpMutation.isLoading} // Disable button while loading
        >
          <span className="text-lg lg:text-sm text-danger">
            {inactivateOtpMutation.isLoading ? "Deleting..." : "Delete"}
          </span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default ContextMenu;
