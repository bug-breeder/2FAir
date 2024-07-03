"use client";
import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { MdDeleteSweep, MdQrCode } from "react-icons/md";
import { FaEdit } from "react-icons/fa";

interface ContextMenuProps {
  activeMenu: { idx: number; x: number; y: number } | null;
  closeMenu: () => void;
  setShowQR: (show: boolean) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  activeMenu,
  closeMenu,
  setShowQR,
}) => {
  return (
    <Dropdown isOpen onClose={closeMenu}>
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
          }}
        >
          <span className="text-lg lg:text-sm text-danger">Delete</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default ContextMenu;
