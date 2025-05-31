import { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";

import { useListOtps, useGenerateOtpCodes } from "../hooks/otp";
import { OTP, OTPSecret } from "../types/otp";
import SmartOTPCard from "../components/smart-otp-card";
import FAB from "../components/fab";

function HomePage() {
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
  const [combinedData, setCombinedData] = useState<Array<{ otp: OTP; secret: OTPSecret }>>([]);
  const [activeMenu, setActiveMenu] = useState<{
    idx: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (otps && otpCodes && Array.isArray(otps) && Array.isArray(otpCodes)) {
      const combined = otps.map((otp: OTP) => {
        const codeData = otpCodes.find((code: OTPSecret) => code.Id === otp.Id);
        
        return {
          otp,
          secret: codeData || {
            Id: otp.Id,
            CurrentCode: "------",
            CurrentExpireAt: new Date().toISOString(),
            NextCode: "------",
            NextExpireAt: new Date().toISOString(),
          },
        };
      }).filter(item => item.secret.CurrentCode !== "------"); // Only show items with valid codes

      setCombinedData(combined);
      console.log("Combined OTP data:", combined);
    }
  }, [otps, otpCodes]);

  const handleOpenMenu = (idx: number, x: number, y: number) => {
    setActiveMenu({ idx, x, y });
  };

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  if (isLoadingOtps || isLoadingOtpCodes) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isErrorOtps || isErrorOtpCodes) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading OTPs</h2>
          <p className="text-default-500">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">2FAir</h1>
          <p className="text-default-500">Manage your 2FA tokens securely</p>
        </div>

        <section className="flex flex-col items-center justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-5 w-full">
            {combinedData.map((item, index) => (
              <SmartOTPCard
                key={item.otp.Id}
                otp={item.otp}
                otpSecret={item.secret}
                activeMenu={activeMenu}
                closeMenu={handleCloseMenu}
                isActive={activeMenu?.idx === index}
                setActiveMenu={(x, y) => handleOpenMenu(index, x, y)}
              />
            ))}
          </div>

          {combinedData.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No OTP tokens yet</h3>
              <p className="text-default-500">
                Add your first 2FA token to get started
              </p>
            </div>
          )}
        </section>
      </div>
      <FAB />
    </div>
  );
}

export default HomePage;
