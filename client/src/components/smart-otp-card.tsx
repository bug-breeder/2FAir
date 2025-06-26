import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tooltip, Avatar, Card, CardBody, CardFooter } from "@heroui/react";
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

import { OTP, OTPSecret } from "../types/otp";

import { ContextMenu } from "./context-menu";
import { QRModal } from "./qr-modal";
import { EditOtpModal } from "./edit-otp-modal";

interface SmartOTPCardProps {
  otp: OTP;
  otpSecret: OTPSecret;
  isActive: boolean;
  setActiveMenu: (x: number, y: number) => void;
  activeMenu: { idx: number; x: number; y: number } | null;
  closeMenu: () => void;
}

interface OTPDisplayData {
  displayCode: string;
  timeRemaining: number;
  isUsingNext: boolean;
  progressValue: number;
}

// Helper components
function OTPInstructions({ copied }: { copied: boolean }) {
  if (copied) {
    return <span>Copied!</span>;
  }

  return (
    <span className="flex items-center">
      <PiHandTapLight />,
      <PiMouseLeftClickFill className="mr-1" />
      <CgArrowRight />
      <MdContentCopy className="ml-1" />
      <RxDividerVertical className="mx-1" />
      <PiHandTapFill />,
      <PiMouseRightClickFill className="mr-1" />
      <CgArrowRight />
      <FiMenu className="ml-1" />
    </span>
  );
}

function ProgressBar({ progressValue, timeRemaining }: { progressValue: number; timeRemaining: number }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="w-20 h-2 bg-default-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            timeRemaining <= 5 ? "bg-danger" : "bg-success"
          }`}
          style={{ width: `${progressValue}%` }}
        />
      </div>
      <span className="text-xs text-default-400">{timeRemaining}s</span>
    </div>
  );
}

function OTPHeader({ otp }: { otp: OTP }) {
  return (
    <div className="flex gap-3 items-center flex-grow overflow-hidden">
      <Avatar
        alt={otp.Issuer}
        className="flex-shrink-0"
        radius="full"
        size="md"
        src={`/providers/SVG/${otp.Issuer}.svg`}
      />
      <div className="flex flex-col gap-1 items-start justify-center flex-grow overflow-hidden">
        <h4 className="text-md leading-none">{otp.Issuer}</h4>
        <h5 className="text-small text-default-500 tracking-tight truncate w-full">
          {otp.Label}
        </h5>
      </div>
    </div>
  );
}

function OTPCodeDisplay({ displayCode, isUsingNext }: { displayCode: string; isUsingNext: boolean }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center font-bold text-xl mx-1">
        {displayCode}
      </div>
      {isUsingNext && (
        <span className="text-xs text-warning">Next Code</span>
      )}
    </div>
  );
}

// Custom hook for OTP display logic
function useOTPDisplay(otpSecret: OTPSecret, otp: OTP): OTPDisplayData {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const now = currentTime;
    const currentExpiry = new Date(otpSecret.CurrentExpireAt).getTime();
    const nextExpiry = new Date(otpSecret.NextExpireAt).getTime();

    let displayCode: string;
    let timeRemaining: number;
    let isUsingNext: boolean;

    if (now < currentExpiry) {
      // Still in current period
      displayCode = otpSecret.CurrentCode;
      timeRemaining = Math.ceil((currentExpiry - now) / 1000);
      isUsingNext = false;
    } else if (now < nextExpiry) {
      // In next period
      displayCode = otpSecret.NextCode;
      timeRemaining = Math.ceil((nextExpiry - now) / 1000);
      isUsingNext = true;
    } else {
      // Both codes expired, show next code but with 0 time
      displayCode = otpSecret.NextCode;
      timeRemaining = 0;
      isUsingNext = true;
    }

    const progressValue = ((otp.Period - timeRemaining) / otp.Period) * 100;

    return {
      displayCode,
      timeRemaining,
      isUsingNext,
      progressValue,
    };
  }, [currentTime, otpSecret, otp.Period]);
}

export function SmartOTPCard({
  otp,
  otpSecret,
  isActive,
  activeMenu,
  setActiveMenu,
  closeMenu,
}: SmartOTPCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const { displayCode, timeRemaining, isUsingNext, progressValue } = useOTPDisplay(otpSecret, otp);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(displayCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [displayCode]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.nativeEvent.stopImmediatePropagation();
    event.preventDefault();
    setTimeout(() => {
      setActiveMenu(event.clientX, event.clientY);
    }, 50);
  }, [setActiveMenu]);

  const handleSetShowQR = useCallback((show: boolean) => {
    setShowQR(show);
  }, []);

  const handleSetShowEdit = useCallback((show: boolean) => {
    setShowEdit(show);
  }, []);

  const tooltipContent = useMemo(() => {
    return copied ? "Copied!" : "Click to copy, right click to open menu";
  }, [copied]);

  return (
    <div>
      <Tooltip content={tooltipContent} placement="top">
        <Card
          isHoverable
          isPressable
          className="w-full max-w-[430px] transition-transform transform betterhover:hover:scale-105 active:scale-95 noselect"
          onContextMenu={handleContextMenu}
          onPress={handleCopy}
        >
          <CardBody className="flex flex-row gap-5 justify-between items-center pt-3 pl-3 pr-3 pb-1">
            <OTPHeader otp={otp} />
            <OTPCodeDisplay displayCode={displayCode} isUsingNext={isUsingNext} />
          </CardBody>
          <CardFooter className="flex items-center justify-between py-2">
            <p className="text-small text-default-300">
              <OTPInstructions copied={copied} />
            </p>
            <ProgressBar progressValue={progressValue} timeRemaining={timeRemaining} />
          </CardFooter>
        </Card>
      </Tooltip>
      {isActive && (
        <ContextMenu
          activeMenu={activeMenu}
          closeMenu={closeMenu}
          otpID={otp.Id}
          setShowEdit={handleSetShowEdit}
          setShowQR={handleSetShowQR}
        />
      )}
      {showQR && (
        <QRModal closeQR={() => setShowQR(false)} otp={otp} showQR={showQR} />
      )}
      {showEdit && (
        <EditOtpModal
          isOpen={showEdit}
          otp={otp}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
