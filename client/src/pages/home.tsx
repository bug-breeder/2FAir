import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import DefaultLayout from "../layouts/default";
import { FAB } from "../components/fab";
import { SmartOTPCard } from "../components/smart-otp-card";
import { useListOtps, useGenerateOtpCodes } from "../hooks/otp";
import { useSearch } from "../providers/search-provider";
import { OTP, OTPSecret } from "../types/otp";

interface CombinedOTPData {
  otp: OTP;
  codes: OTPSecret;
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [activeMenu, setActiveMenu] = useState<{ idx: number; x: number; y: number } | null>(null);
  
  const { data: otps, isLoading: otpsLoading, error: otpsError } = useListOtps();
  const { data: otpCodes, isLoading: codesLoading, error: codesError } = useGenerateOtpCodes();
  const { searchQuery } = useSearch();

  const handleOpenMenu = useCallback((index: number, x: number, y: number) => {
    setActiveMenu({ idx: index, x, y });
  }, []);

  const handleCloseMenu = useCallback(() => {
    setActiveMenu(null);
  }, []);

  // Filter OTPs based on search query
  const combinedData = useMemo((): CombinedOTPData[] => {
    if (!otps || !Array.isArray(otps) || !otpCodes || !Array.isArray(otpCodes)) {
      return [];
    }
    
    let filteredResults: OTP[] = otps;

    // If there's a search query, filter by query
    const searchTerm = query || searchQuery;
    if (searchTerm && searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredResults = otps.filter((otp: OTP) => 
        otp.Issuer.toLowerCase().includes(lowerSearchTerm) ||
        otp.Label.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Combine OTPs with their codes
    const combined: CombinedOTPData[] = filteredResults
      .map((otp: OTP) => {
        const codes = otpCodes.find((code: OTPSecret) => code.Id === otp.Id);
        return codes ? { otp, codes } : null;
      })
      .filter((item): item is CombinedOTPData => item !== null);

    return combined;
  }, [otps, otpCodes, query, searchQuery]);

  const isLoading = otpsLoading || codesLoading;
  const hasError = otpsError || codesError;

  if (isLoading) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 px-4 sm:px-0">
          <div className="text-center">Loading your secure TOTP vault...</div>
        </section>
      </DefaultLayout>
    );
  }

  if (hasError) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 px-4 sm:px-0">
          <div className="text-center text-danger">
            Error loading OTPs: {otpsError?.message || codesError?.message || 'Unknown error'}
          </div>
        </section>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center px-4 sm:px-0">
        <div className="w-full max-w-md sm:max-w-none mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {combinedData.map((item, index) => (
            <SmartOTPCard
              key={item.otp.Id}
              activeMenu={activeMenu}
              closeMenu={handleCloseMenu}
              isActive={activeMenu?.idx === index}
              otp={item.otp}
              otpSecret={item.codes}
              setActiveMenu={(x, y) => handleOpenMenu(index, x, y)}
            />
          ))}
        </div>
        <FAB />
      </section>
    </DefaultLayout>
  );
}
