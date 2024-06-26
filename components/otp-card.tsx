"use client";
import React, { useState, useEffect } from "react";
import { Avatar, Button, Tooltip } from "@nextui-org/react";
import { Card, CardBody, CardFooter } from "@nextui-org/card";
import * as OTPAuth from "otpauth";
import { toast } from "react-toastify";

interface OTPCardProps {
  issuer: string;
  label: string;
  secret: string;
  period: number;
}

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTPCard: React.FC<OTPCardProps> = ({ issuer, label, secret, period }) => {
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState(period);
  const [currentCode, setCurrentCode] = useState("");

  const totp = new OTPAuth.TOTP({
    issuer,
    label,
    algorithm: "SHA1",
    digits: 6,
    period,
    secret: OTPAuth.Secret.fromBase32(secret),
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
          return period;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [period, totp]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode).then(() => {
      toast.success("OTP code copied to clipboard!");
    });
  };

  const filledDots = Math.floor((remainingTime / period) * 5);
  const dots = Array.from({ length: 5 }, (_, i) => i < filledDots);

  return (
    <Tooltip content={copied ? "Copied!" : "Click to copy"} placement="top">
      <Card
        isPressable
        isHoverable
        onPress={handleCopy}
        className="max-w-[430px] transition-transform transform hover:scale-105 active:scale-95"
      >
        <CardBody className="flex flex-row gap-5 justify-between pt-3 pl-3 pr-3 pb-1">
          <div className="flex gap-5">
            <Avatar
              isBordered
              radius="full"
              size="md"
              src="https://nextui.org/avatars/avatar-1.png"
            />
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-md leading-none">{issuer}</h4>
              <h5 className="text-md tracking-tight truncate w-40">{label}</h5>
            </div>
          </div>
          <div className=" flex flex-col gap-1 items-start justify-center font-bold text-xl">
            {currentCode}
          </div>
        </CardBody>
        <CardFooter className="flex items-center justify-between py-2">
          <p className="text-small text-default-300">
            {copied ? "Copied!" : "Tap to copy the OTP code"}
          </p>
          {/* <BiChevronRight size={24} /> */}
          <div className="flex justify-center my-2">
            {dots.map((filled, index) => (
              <div
                key={index}
                className={`h-2 w-2 mx-1 rounded-full ${
                  filled ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </CardFooter>
      </Card>
    </Tooltip>
  );
};

export default OTPCard;
