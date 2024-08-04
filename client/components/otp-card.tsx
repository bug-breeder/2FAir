"use client";
import React, { useState, useEffect } from "react";
import { Tooltip, Avatar } from "@nextui-org/react";
import { Card, CardBody, CardFooter } from "@nextui-org/card";
import * as OTPAuth from "otpauth";
import { MdContentCopy } from "react-icons/md";
import { FiMenu } from "react-icons/fi";
import {
  PiMouseRightClickFill,
  PiMouseLeftClickFill,
  PiHandTapFill,
  PiHandTapLight,
} from "react-icons/pi";
import { RxDividerVertical } from "react-icons/rx";
import { CgArrowRight } from "react-icons/cg";
import ContextMenu from "@/components/context-menu";
import QRModal from "@/components/qr-modal";
import OTPProgress from "@/components/progress-bar";

interface OTPCardProps {
  otp: {
    issuer: string;
    label: string;
    secret: string;
    period: number;
  };
  isActive: boolean;
  setActiveMenu: (x: number, y: number) => void;
  activeMenu: { idx: number; x: number; y: number } | null;
  closeMenu: () => void;
}

const OTPCard: React.FC<OTPCardProps> = ({
  otp,
  isActive,
  activeMenu,
  setActiveMenu,
  closeMenu,
}) => {
  const [copied, setCopied] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [showQR, setShowQR] = useState(false);

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
      generateCode();
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [otp.period, totp]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.nativeEvent.stopImmediatePropagation();
    event.preventDefault();
    setTimeout(() => {
      setActiveMenu(event.clientX, event.clientY);
    }, 50); // Add a slight delay to prevent immediate triggering
  };

  return (
    <div>
      <Tooltip
        content={copied ? "Copied!" : "Click to copy, right click to open menu"}
        placement="top"
      >
        <Card
          isHoverable
          isPressable
          className="w-full max-w-[430px] transition-transform transform betterhover:hover:scale-105 active:scale-95 noselect"
          onContextMenu={handleContextMenu}
          onPress={handleCopy}
        >
          <CardBody className="flex flex-row gap-5 justify-between items-center pt-3 pl-3 pr-3 pb-1">
            <div className="flex gap-3 items-center flex-grow overflow-hidden">
              <Avatar
                className="flex-shrink-0"
                radius="full"
                size="md"
                src={`/providers/SVG/${otp.issuer}.svg`}
                alt={otp.issuer}
              />
              <div className="flex flex-col gap-1 items-start justify-center flex-grow overflow-hidden">
                <h4 className="text-md leading-none">{otp.issuer}</h4>
                <h5 className="text-small text-default-500 tracking-tight truncate w-full">
                  {otp.label}
                </h5>
              </div>
            </div>
            <div className="flex items-center font-bold text-xl mx-1">
              {currentCode}
            </div>
          </CardBody>
          <CardFooter className="flex items-center justify-between py-2">
            <p className="text-small text-default-300">
              {copied ? (
                "Copied!"
              ) : (
                <span className="flex items-center">
                  <PiHandTapLight />,
                  <PiMouseLeftClickFill className="mr-1" />
                  <CgArrowRight />
                  <MdContentCopy className="ml-1" /> {/* Copy icon */}
                  <RxDividerVertical className="mx-1" />
                  <PiHandTapFill />,
                  <PiMouseRightClickFill className="mr-1" />
                  <CgArrowRight />
                  <FiMenu className="ml-1" /> {/* Menu icon */}
                </span>
              )}
            </p>
            <OTPProgress period={otp.period} updateInterval={100} />
          </CardFooter>
        </Card>
      </Tooltip>
      {isActive && (
        <ContextMenu
          activeMenu={activeMenu}
          closeMenu={closeMenu}
          setShowQR={setShowQR}
        />
      )}
      {showQR && (
        <QRModal showQR={showQR} closeQR={() => setShowQR(false)} otp={otp} />
      )}
    </div>
  );
};

export default OTPCard;
