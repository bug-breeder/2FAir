"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Avatar,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
} from "@nextui-org/react";
import { Card, CardBody, CardFooter } from "@nextui-org/card";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode.react";

interface OTPCardProps {
  otp: {
    issuer: string;
    label: string;
    secret: string;
    period: number;
  };
}

const OTPCard: React.FC<OTPCardProps> = ({ otp }) => {
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState(otp.period);
  const [currentCode, setCurrentCode] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(
    null
  );

  const totp = new OTPAuth.TOTP({
    issuer: otp.issuer,
    label: otp.label,
    algorithm: "SHA1",
    digits: 6,
    period: otp.period,
    secret: OTPAuth.Secret.fromBase32(otp.secret),
  });

  useEffect(() => {
    const generateCode = () => {
      setCurrentCode(totp.generate());
    };

    generateCode();

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === 1) {
          generateCode();
          return otp.period;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otp.period, totp]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filledDots = Math.floor((remainingTime / otp.period) * 5);
  const dots = Array.from({ length: 5 }, (_, i) => i < filledDots);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuAnchor({ x: event.clientX, y: event.clientY });
  };

  const handleLongPress = (event: React.TouchEvent) => {
    event.preventDefault();
    setMenuAnchor({ x: event.touches[0].clientX, y: event.touches[0].clientY });
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  return (
    <div onContextMenu={handleContextMenu} onTouchStart={handleLongPress}>
      <Tooltip content={copied ? "Copied!" : "Click to copy"} placement="top">
        <Card
          isHoverable
          isPressable
          className="w-full max-w-[430px] transition-transform transform betterhover:hover:scale-105 active:scale-95"
          onPress={handleCopy}
        >
          <CardBody className="flex flex-row gap-5 justify-between items-center pt-3 pl-3 pr-3 pb-1">
            <div className="flex gap-3 items-center flex-grow overflow-hidden">
              <Avatar
                className="flex-shrink-0"
                radius="full"
                size="md"
                src="https://nextui.org/avatars/avatar-1.png"
              />
              <div className="flex flex-col gap-1 items-start justify-center flex-grow overflow-hidden">
                <h4 className="text-md leading-none">{otp.issuer}</h4>
                <h5 className="text-small tracking-tight truncate w-full">
                  {otp.label}
                </h5>
              </div>
            </div>
            <div className="flex items-center font-bold text-xl">
              {currentCode}
            </div>
          </CardBody>
          <CardFooter className="flex items-center justify-between py-2">
            <p className="text-small text-default-300">
              {copied ? "Copied!" : "Tap to copy the OTP code"}
            </p>
            <div className="flex justify-center my-2">
              {dots.map((filled, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 ml-2 rounded-full ${
                    filled ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </CardFooter>
        </Card>
      </Tooltip>
      {menuAnchor && (
        <Dropdown isOpen onClose={closeMenu}>
          <DropdownTrigger>
            <div
              style={{
                position: "absolute",
                top: menuAnchor.y,
                left: menuAnchor.x,
                width: 0,
                height: 0,
              }}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Actions">
            <DropdownItem key="qr" onClick={() => setShowQR(true)}>
              Show QR
            </DropdownItem>
            <DropdownItem key="edit">Edit</DropdownItem>
            <DropdownItem key="delete" className="text-danger">
              Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      )}
      {showQR && (
        <Modal isOpen={showQR} onClose={() => setShowQR(false)}>
          <ModalContent>
            <QRCode
              value={`otpauth://totp/${otp.issuer}:${otp.label}?secret=${otp.secret}&issuer=${otp.issuer}&algorithm=SHA1&digits=6&period=${otp.period}`}
            />
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default OTPCard;
