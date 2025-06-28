import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "@heroui/react";

import DefaultLayout from "../layouts/default";
import { FAB } from "../components/fab";
import { SmartOTPCard } from "../components/smart-otp-card";
import { useListOtps, useGenerateOtpCodes } from "../hooks/otp";
import { useSearch } from "../providers/search-provider";
import { OTP, OTPSecret } from "../types/otp";
import { searchOTPs, getSearchStats } from "../lib/search";

interface CombinedOTPData {
  otp: OTP;
  codes: OTPSecret;
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [activeMenu, setActiveMenu] = useState<{
    idx: number;
    x: number;
    y: number;
  } | null>(null);

  const {
    data: otps,
    isLoading: otpsLoading,
    error: otpsError,
  } = useListOtps();
  const {
    data: otpCodes,
    isLoading: codesLoading,
    error: codesError,
  } = useGenerateOtpCodes();
  const { searchQuery } = useSearch();

  const handleOpenMenu = useCallback((index: number, x: number, y: number) => {
    setActiveMenu({ idx: index, x, y });
  }, []);

  const handleCloseMenu = useCallback(() => {
    setActiveMenu(null);
  }, []);

  // Combine OTPs with their codes
  const combinedData = useMemo((): CombinedOTPData[] => {
    if (
      !otps ||
      !Array.isArray(otps) ||
      !otpCodes ||
      !Array.isArray(otpCodes)
    ) {
      return [];
    }

    // Combine OTPs with their codes first
    const combined: CombinedOTPData[] = otps
      .map((otp: OTP) => {
        const codes = otpCodes.find((code: OTPSecret) => code.Id === otp.Id);

        return codes ? { otp, codes } : null;
      })
      .filter((item): item is CombinedOTPData => item !== null);

    return combined;
  }, [otps, otpCodes]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    const searchTerm = query || searchQuery;
    const searchableItems = combinedData.map((item) => ({
      otp: item.otp,
      secret: item.codes,
    }));

    return searchOTPs(searchableItems, searchTerm);
  }, [combinedData, query, searchQuery]);

  // Get search statistics
  const searchStats = useMemo(() => {
    const searchTerm = query || searchQuery;

    return getSearchStats(combinedData.length, filteredData.length, searchTerm);
  }, [combinedData.length, filteredData.length, query, searchQuery]);

  const isLoading = otpsLoading || codesLoading;
  const hasError = otpsError || codesError;

  if (isLoading) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 px-4 sm:px-0 min-h-[calc(100vh-200px)]">
          <Spinner size="lg" />
        </section>
      </DefaultLayout>
    );
  }

  if (hasError) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 px-4 sm:px-0">
          <div className="text-center text-danger">
            Error loading OTPs:{" "}
            {otpsError?.message || codesError?.message || "Unknown error"}
          </div>
        </section>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center px-4 sm:px-0">
        {/* Search Statistics */}
        {searchStats.isSearchActive && (
          <div className="w-full max-w-md sm:max-w-none mx-auto mb-6">
            <p className="text-sm text-default-500">
              {searchStats.filteredItems} of {searchStats.totalItems} OTP
              {searchStats.totalItems !== 1 ? "s" : ""}
              {searchStats.query && ` matching "${searchStats.query}"`}
            </p>
          </div>
        )}

        {/* OTP Grid */}
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-default-700 mb-4">
                {combinedData.length === 0 ? "No OTPs Yet" : "No Matching OTPs"}
              </h2>
              <p className="text-default-500 mb-6">
                {combinedData.length === 0
                  ? "Add your first TOTP to get started with secure 2FA management."
                  : "Try adjusting your search query to find what you're looking for."}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md sm:max-w-none mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredData.map((item, index) => (
              <SmartOTPCard
                key={item.otp.Id}
                activeMenu={activeMenu}
                closeMenu={handleCloseMenu}
                isActive={activeMenu?.idx === index}
                otp={item.otp}
                otpSecret={item.secret}
                setActiveMenu={(x, y) => handleOpenMenu(index, x, y)}
              />
            ))}
          </div>
        )}

        <FAB />
      </section>
    </DefaultLayout>
  );
}
