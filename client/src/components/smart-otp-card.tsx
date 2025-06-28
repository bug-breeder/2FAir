import { useState, useEffect, useMemo, useCallback } from "react";
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

import { useSimpleIconSrc } from "./simple-icon";
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

export function SmartOTPCard({
  otp,
  otpSecret,
  isActive,
  activeMenu,
  setActiveMenu,
  closeMenu,
}: SmartOTPCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Get Simple Icons CDN URL for the provider
  const iconSrc = useSimpleIconSrc(otp.Issuer, {
    fallbackIcon: "generic",
  });

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate which code to display and time remaining
  const { displayCode, timeRemaining, isUsingNext } = useMemo(() => {
    const now = currentTime;
    const currentExpiry = new Date(otpSecret.CurrentExpireAt).getTime();
    const nextExpiry = new Date(otpSecret.NextExpireAt).getTime();

    if (now < currentExpiry) {
      // Still in current period
      return {
        displayCode: otpSecret.CurrentCode,
        timeRemaining: Math.ceil((currentExpiry - now) / 1000),
        isUsingNext: false,
      };
    } else if (now < nextExpiry) {
      // In next period
      return {
        displayCode: otpSecret.NextCode,
        timeRemaining: Math.ceil((nextExpiry - now) / 1000),
        isUsingNext: true,
      };
    } else {
      // Both codes expired, show next code but with 0 time
      return {
        displayCode: otpSecret.NextCode,
        timeRemaining: 0,
        isUsingNext: true,
      };
    }
  }, [currentTime, otpSecret]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [displayCode]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveMenu(e.clientX, e.clientY);
    },
    [setActiveMenu],
  );

  // Calculate progress (0-100)
  const progressValue = ((otp.Period - timeRemaining) / otp.Period) * 100;

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
          <CardBody className="flex flex-row gap-5 justify-between items-center pt-4 px-4 pb-2">
            <div className="flex gap-3 items-center flex-grow overflow-hidden">
              <Avatar
                alt={otp.Issuer}
                className="flex-shrink-0"
                radius="full"
                size="md"
                src={iconSrc}
              />
              <div className="flex flex-col gap-1 items-start justify-center flex-grow overflow-hidden">
                <h4 className="text-xl font-semibold leading-none">
                  {otp.Issuer}
                </h4>
                <h5 className="text-medium text-default-500 tracking-tight truncate w-full">
                  {otp.Label}
                </h5>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center text-default-500 font-bold text-xl mx-1">
                {displayCode}
              </div>
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
                  <MdContentCopy className="ml-1" />
                  <RxDividerVertical className="mx-1" />
                  <PiHandTapFill />,
                  <PiMouseRightClickFill className="mr-1" />
                  <CgArrowRight />
                  <FiMenu className="ml-1" />
                </span>
              )}
            </p>
            <div className="flex flex-col items-end gap-1">
              <div className="w-20 h-2 bg-default-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeRemaining <= 5 ? "bg-danger" : "bg-success"
                  }`}
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          </CardFooter>
        </Card>
      </Tooltip>

      {/* Context Menu */}
      {isActive && (
        <ContextMenu
          activeMenu={activeMenu}
          closeMenu={closeMenu}
          otpID={otp.Id}
          setShowEdit={setShowEditModal}
          setShowQR={setShowQRModal}
        />
      )}

      {/* QR Modal */}
      <QRModal
        closeQR={() => setShowQRModal(false)}
        otp={otp}
        showQR={showQRModal}
      />

      {/* Edit Modal */}
      <EditOtpModal
        isOpen={showEditModal}
        otp={otp}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
}
