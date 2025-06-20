import { useState, useEffect, useMemo } from "react";
import { Spinner } from "@heroui/react";

import { useListOtps, useGenerateOtpCodes } from "../hooks/otp";
import { useSearch } from "../providers/search-provider";
import { OTP, OTPSecret } from "../types/otp";
import { searchOTPs, getSearchStats } from "../lib/search";
import SmartOTPCard from "../components/smart-otp-card";
import FAB from "../components/fab";
import { Navbar } from "../components/navbar";

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
  const { searchQuery, isSearchActive } = useSearch();
  const [combinedData, setCombinedData] = useState<
    Array<{ otp: OTP; secret: OTPSecret }>
  >([]);
  const [activeMenu, setActiveMenu] = useState<{
    idx: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
    };

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (otps && otpCodes && Array.isArray(otps) && Array.isArray(otpCodes)) {
      const combined = otps
        .map((otp: OTP) => {
          const codeData = otpCodes.find(
            (code: OTPSecret) => code.Id === otp.Id,
          );

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
        })
        .filter((item) => item.secret.CurrentCode !== "------"); // Only show items with valid codes

      setCombinedData(combined);
      console.log("Combined OTP data:", combined);
    }
  }, [otps, otpCodes]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    return searchOTPs(combinedData, searchQuery);
  }, [combinedData, searchQuery]);

  // Get search statistics
  const searchStats = useMemo(() => {
    return getSearchStats(combinedData.length, filteredData.length, searchQuery);
  }, [combinedData.length, filteredData.length, searchQuery]);

  const handleOpenMenu = (idx: number, x: number, y: number) => {
    setActiveMenu({ idx, x, y });
  };

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  if (isLoadingOtps || isLoadingOtpCodes) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isErrorOtps || isErrorOtpCodes) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error loading OTPs</h2>
            <p className="text-default-500">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <section className="flex flex-col items-center justify-center">
          {/* Search Results Header */}
          {searchStats.isSearchActive && (
            <div className="w-full mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Search Results for "{searchStats.query}"
                </h2>
                <p className="text-sm text-default-500">
                  {searchStats.filteredItems} of {searchStats.totalItems} tokens
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-5 w-full">
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

          {/* Empty States */}
          {searchStats.totalItems === 0 && !searchStats.isSearchActive && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No OTP tokens yet</h3>
              <p className="text-default-500">
                Add your first 2FA token to get started
              </p>
            </div>
          )}

          {!searchStats.hasResults && searchStats.isSearchActive && searchStats.totalItems > 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No matching tokens found</h3>
              <p className="text-default-500">
                Try adjusting your search terms or clear the search to see all tokens
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
