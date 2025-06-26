import { useCallback } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { FiShare2 } from "react-icons/fi";
import { MdEdit, MdDelete } from "react-icons/md";

import { useInactivateOtp } from "../hooks/otp";
import { toast } from "../lib/toast";

interface ContextMenuProps {
  activeMenu: { idx: number; x: number; y: number } | null;
  closeMenu: () => void;
  otpID: string;
  setShowQR: (show: boolean) => void;
  setShowEdit: (show: boolean) => void;
}

export function ContextMenu({
  activeMenu,
  closeMenu,
  otpID,
  setShowQR,
  setShowEdit,
}: ContextMenuProps) {
  const inactivateOtpMutation = useInactivateOtp();

  const handleShowQR = useCallback(() => {
    setShowQR(true);
    closeMenu();
  }, [setShowQR, closeMenu]);

  const handleEdit = useCallback(() => {
    setShowEdit(true);
    closeMenu();
  }, [setShowEdit, closeMenu]);

  const handleInactivate = useCallback(() => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this OTP? This action cannot be undone."
    );

    if (!confirmed) {
      closeMenu();
      return;
    }

    inactivateOtpMutation.mutate(otpID, {
      onSuccess: () => {
        toast.success("OTP deleted successfully");
        closeMenu();
      },
      onError: (error: any) => {
        console.error("Error deleting OTP:", error);
        const errorMessage = error.response?.data?.error || "Failed to delete OTP";
        toast.error(errorMessage);
        closeMenu();
      },
    });
  }, [otpID, inactivateOtpMutation, closeMenu]);

  if (!activeMenu) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={closeMenu}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="absolute z-50"
        style={{
          left: `${activeMenu.x}px`,
          top: `${activeMenu.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Dropdown isOpen placement="bottom-start">
          <DropdownTrigger>
            <Button className="invisible" size="sm" />
          </DropdownTrigger>
          <DropdownMenu
            aria-label="OTP Actions"
            variant="faded"
            onAction={(key) => {
              switch (key) {
                case "qr":
                  handleShowQR();
                  break;
                case "edit":
                  handleEdit();
                  break;
                case "delete":
                  handleInactivate();
                  break;
              }
            }}
          >
            <DropdownItem
              key="qr"
              description="Show QR code for this OTP"
              startContent={<FiShare2 className="text-lg" />}
            >
              Show QR Code
            </DropdownItem>
            <DropdownItem
              key="edit"
              description="Edit OTP details"
              startContent={<MdEdit className="text-lg" />}
            >
              Edit
            </DropdownItem>
            <DropdownItem
              key="delete"
              className="text-danger"
              color="danger"
              description="Permanently delete this OTP"
              startContent={<MdDelete className="text-lg" />}
            >
              Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
