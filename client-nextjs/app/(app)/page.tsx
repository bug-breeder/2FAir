"use client";

import React, { useState, useEffect } from "react";
import FAB from "@/components/fab";
import OTPCard from "@/components/otp-card";
import { useListOtps, useGenerateOtpCodes } from "@/hooks/otp";
import { OTP, OTPSecret } from "@/types/otp";
import { getServerDate } from "@/libs/time-sync/server-date";
import { Spinner } from "@heroui/react";
import { useSetupAxiosInterceptors } from "@/libs/api/axios";

export default function Home() {
  useSetupAxiosInterceptors();
  const {
    data: otps,
    isLoading: isLoadingOtps,
    isError: isErrorOtps,
  } = useListOtps();
  const {
    data: otpCodes,
    isLoading: isLoadingOtpCodes,
    isError: isErrorOtpCodes,
  } = useGenerateOtpCodes();
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [serverOffset, setServerOffset] = useState<number | undefined>(
    undefined
  );

  const fetchServerTimeOffset = async () => {
    try {
      const { date, offset, uncertainty } = await getServerDate();

      console.log(offset);
      setServerOffset(offset);
    } catch (err) {
      console.log("Failed to fetch network time:", err);
    }
  };

  const [activeMenu, setActiveMenu] = useState<{
    idx: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (otps && otpCodes) {
      // fetchServerTimeOffset();
      // console.log("Server time offset:", serverOffset);
      const combined = otps.map((otp: OTP) => {
        const codeData = otpCodes.find((code: OTPSecret) => code.Id === otp.Id);

        return {
          ...otp,
          Secret: codeData?.CurrentCode || "",
        };
      });

      setCombinedData(combined);
      console.log(combined);
    }
  }, [otpCodes]);

  const handleOpenMenu = (idx: number, x: number, y: number) => {
    setActiveMenu({ idx, x, y });
  };

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  if (isLoadingOtps || isLoadingOtpCodes) {
    return <Spinner />; // Optionally replace with a skeleton loader or spinner
  }

  if (isErrorOtps || isErrorOtpCodes) {
    return <div>Error loading OTPs</div>;
  }

  return (
    <section className="flex flex-col items-center justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-5">
        {combinedData.map((otp, index) => (
          <OTPCard
            key={index}
            activeMenu={activeMenu}
            closeMenu={handleCloseMenu}
            isActive={activeMenu?.idx === index}
            otp={otp}
            setActiveMenu={(x, y) => handleOpenMenu(index, x, y)}
          />
        ))}
      </div>
      <FAB />
    </section>
  );
}
