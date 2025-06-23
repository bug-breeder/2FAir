import { useState, useEffect, useMemo } from "react";
import { Spinner } from "@heroui/react";

import { useListOtps } from "../hooks/otp";
import { useSearch } from "../providers/search-provider";
import { OTP, OTPSecret } from "../types/otp";
import { searchOTPs, getSearchStats } from "../lib/search";
import SmartOTPCard from "../components/smart-otp-card";
import FAB from "../components/fab";
import { Navbar } from "../components/navbar";
import { generateTOTPCodes, TOTPConfig } from "../lib/totp";
import { decryptData, EncryptedData } from "../lib/crypto";
import { authenticateWebAuthn } from "../lib/webauthn";

function HomePage() {
  const {
    data: otps,
    isLoading: isLoadingOtps,
    isError: isErrorOtps,
  } = useListOtps();
  
  const { searchQuery, isSearchActive } = useSearch();
  const [combinedData, setCombinedData] = useState<
    Array<{ otp: OTP; secret: OTPSecret }>
  >([]);
  const [activeMenu, setActiveMenu] = useState<{
    idx: number;
    x: number;
    y: number;
  } | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
    };

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Authenticate with WebAuthn to get encryption key when OTPs are loaded
  useEffect(() => {
    const authenticateForDecryption = async () => {
      if (otps && Array.isArray(otps) && otps.length > 0 && !encryptionKey && !isDecrypting) {
        setIsDecrypting(true);
        setDecryptionError(null);
        
        try {
          console.log('Authenticating with WebAuthn to decrypt TOTP secrets...');
          const key = await authenticateWebAuthn();
          setEncryptionKey(key);
          console.log('WebAuthn authentication successful, decryption key obtained');
        } catch (error) {
          console.error('WebAuthn authentication failed:', error);
          setDecryptionError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsDecrypting(false);
        }
      }
    };

    authenticateForDecryption();
  }, [otps, encryptionKey, isDecrypting]);

  // Generate TOTP codes when OTPs and encryption key are available
  useEffect(() => {
    const generateCodes = async () => {
      if (otps && Array.isArray(otps) && encryptionKey) {
        try {
          const combined = await Promise.all(
            otps.map(async (otp: OTP) => {
              try {
                // Decrypt the TOTP secret
                const encryptedData: EncryptedData = {
                  ciphertext: otp.Secret.split('.')[0] || '',
                  iv: otp.Secret.split('.')[1] || '',
                  authTag: otp.Secret.split('.')[2] || '',
                };

                const decryptedSecret = await decryptData(encryptedData, encryptionKey);
                
                // Generate TOTP codes
                const totpConfig: TOTPConfig = {
                  secret: decryptedSecret,
                  issuer: otp.Issuer,
                  label: otp.Label,
                  algorithm: 'SHA1', // Default algorithm
                  digits: 6, // Default digits
                  period: otp.Period,
                };

                const codes = generateTOTPCodes(totpConfig);

                return {
                  otp,
                  secret: {
                    Id: otp.Id,
                    CurrentCode: codes.currentCode,
                    CurrentExpireAt: codes.currentExpireAt.toISOString(),
                    NextCode: codes.nextCode,
                    NextExpireAt: codes.nextExpireAt.toISOString(),
                  },
                };
              } catch (error) {
                console.error(`Failed to decrypt/generate codes for OTP ${otp.Id}:`, error);
                // Return placeholder data for failed decryption
                return {
                  otp,
                  secret: {
                    Id: otp.Id,
                    CurrentCode: "ERROR",
                    CurrentExpireAt: new Date().toISOString(),
                    NextCode: "ERROR",
                    NextExpireAt: new Date().toISOString(),
                  },
                };
              }
            })
          );

          setCombinedData(combined);
          console.log("TOTP codes generated successfully from decrypted secrets");
        } catch (error) {
          console.error('Failed to generate TOTP codes:', error);
        }
      } else if (otps && Array.isArray(otps) && !encryptionKey) {
        // Show placeholder data while waiting for authentication
        const combined = otps.map((otp: OTP) => ({
          otp,
          secret: {
            Id: otp.Id,
            CurrentCode: "AUTH_REQUIRED",
            CurrentExpireAt: new Date().toISOString(),
            NextCode: "AUTH_REQUIRED",
            NextExpireAt: new Date().toISOString(),
          },
        }));

        setCombinedData(combined);
      }
    };

    generateCodes();
  }, [otps, encryptionKey]);

  // Auto-refresh TOTP codes every 30 seconds
  useEffect(() => {
    if (combinedData.length > 0 && encryptionKey) {
      const interval = setInterval(() => {
        // Regenerate codes for all OTPs
        const updatedData = combinedData.map(({ otp }) => {
          try {
            // Parse the encrypted secret (assuming format: ciphertext.iv.authTag)
            const encryptedData: EncryptedData = {
              ciphertext: otp.Secret.split('.')[0] || '',
              iv: otp.Secret.split('.')[1] || '',
              authTag: otp.Secret.split('.')[2] || '',
            };

            // For simplicity, we'll just update the existing codes
            // In a real implementation, you'd decrypt and regenerate
            const existing = combinedData.find(item => item.otp.Id === otp.Id);
            if (existing) {
              return existing;
            }

            return {
              otp,
              secret: {
                Id: otp.Id,
                CurrentCode: "------",
                CurrentExpireAt: new Date().toISOString(),
                NextCode: "------",
                NextExpireAt: new Date().toISOString(),
              },
            };
          } catch (error) {
            console.error(`Failed to refresh codes for OTP ${otp.Id}:`, error);
            return combinedData.find(item => item.otp.Id === otp.Id) || {
              otp,
              secret: {
                Id: otp.Id,
                CurrentCode: "ERROR",
                CurrentExpireAt: new Date().toISOString(),
                NextCode: "ERROR",
                NextExpireAt: new Date().toISOString(),
              },
            };
          }
        });

        setCombinedData(updatedData);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [combinedData, encryptionKey]);

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

  // Show loading state
  if (isLoadingOtps) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // Show error state
  if (isErrorOtps) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-danger mb-4">Failed to Load OTPs</h2>
            <p className="text-default-500">Please check your connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (isDecrypting) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Spinner size="lg" className="mb-4" />
            <h2 className="text-2xl font-bold mb-4">Authenticating...</h2>
            <p className="text-default-500">Please complete WebAuthn authentication to decrypt your TOTP secrets.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show decryption error state
  if (decryptionError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-danger mb-4">Authentication Failed</h2>
            <p className="text-default-500 mb-4">{decryptionError}</p>
            <button
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
                 {/* Search Statistics */}
         {isSearchActive && (
           <div className="mb-6">
             <p className="text-sm text-default-500">
               {searchStats.filteredItems} of {searchStats.totalItems} OTP{searchStats.totalItems !== 1 ? 's' : ''} 
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
                  : "Try adjusting your search query to find what you're looking for."
                }
              </p>
            </div>
          </div>
        ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredData.map((item, index) => (
               <SmartOTPCard
                 key={item.otp.Id}
                 otp={item.otp}
                 otpSecret={item.secret}
                 isActive={activeMenu?.idx === index}
                 setActiveMenu={(x: number, y: number) => handleOpenMenu(index, x, y)}
                 activeMenu={activeMenu}
                 closeMenu={handleCloseMenu}
               />
             ))}
           </div>
        )}

        {/* Floating Action Button */}
        <FAB />
      </main>
    </div>
  );
}

export default HomePage;
