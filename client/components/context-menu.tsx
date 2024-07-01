"use client";
import React, { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";

interface ContextMenuProps {
  otp: { issuer: string; label: string; secret: string; period: number };
  onEdit: (otp: any) => void;
  onDelete: (otp: any) => void;
  onShowQR: (otp: any) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  otp,
  onEdit,
  onDelete,
  onShowQR,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const handleContextMenu = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    if (event.type === "contextmenu") {
      const mouseEvent = event as MouseEvent;
      setPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
    } else if (event.type === "touchend") {
      const touchEvent = event as TouchEvent;
      setPosition({
        x: touchEvent.changedTouches[0].clientX,
        y: touchEvent.changedTouches[0].clientY,
      });
    }
    setVisible(true);
  };

  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("touchend", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("touchend", handleContextMenu);
    };
  }, []);

  return (
    visible && (
      <Dropdown
        // placement="bottom-left"
        isOpen={visible}
        onOpenChange={setVisible}
        shouldBlockScroll={false}
      >
        <DropdownTrigger>
          <div
            style={{
              position: "fixed",
              top: position.y,
              left: position.x,
              width: 1,
              height: 1,
            }}
          />
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Context menu"
          onAction={(key) => {
            setVisible(false);
            if (key === "edit") onEdit(otp);
            if (key === "delete") onDelete(otp);
            if (key === "showQR") onShowQR(otp);
          }}
        >
          <DropdownItem key="showQR">Show QR</DropdownItem>
          <DropdownItem key="edit">Edit</DropdownItem>
          <DropdownItem key="delete" className="text-danger" color="danger">
            Delete
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    )
  );
};

export default ContextMenu;
