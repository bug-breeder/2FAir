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

  const handleSetActiveMenu = useCallback((x: number, y: number) => {
    setActiveMenu({ idx: 0, x, y });
  }, []);

  const handleCloseMenu = useCallback(() => {
    setActiveMenu(null);
  }, []);

  // Close menu when clicking outside
  const handleBackdropClick = useCallback(() => {
    if (activeMenu) {
      setActiveMenu(null);
    }
  }, [activeMenu]);

  // Filter OTPs based on search query
  const filteredOTPs = useMemo((): CombinedOTPData[] => {
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
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="text-center">Loading your secure TOTP vault...</div>
        </section>
      </DefaultLayout>
    );
  }

  if (hasError) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="text-center text-danger">
            Error loading OTPs: {otpsError?.message || codesError?.message || 'Unknown error'}
          </div>
        </section>
      </DefaultLayout>
    );
  }

  const displayQuery = query || searchQuery;

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-4xl text-center justify-center">
          <h1 className="text-4xl font-bold mb-2">Your Secure TOTP Vault</h1>
          <p className="text-default-600 mb-8">
            {displayQuery ? `Search results for "${displayQuery}"` : 'Manage your two-factor authentication codes'}
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-4xl px-4">
          {filteredOTPs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-default-600">
                {displayQuery ? 'No TOTPs match your search.' : 'No TOTPs found. Add your first one using the + button!'}
              </p>
            </div>
          ) : (
            filteredOTPs.map(({ otp, codes }: CombinedOTPData, index: number) => (
              <SmartOTPCard
                key={otp.Id}
                activeMenu={activeMenu}
                closeMenu={handleCloseMenu}
                isActive={activeMenu?.idx === index}
                otp={otp}
                otpSecret={codes}
                setActiveMenu={handleSetActiveMenu}
              />
            ))
          )}
        </div>
      </section>

      {/* Backdrop for menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={handleBackdropClick}
        />
      )}

      <FAB />
    </DefaultLayout>
  );
}
