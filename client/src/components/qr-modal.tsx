import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Divider,
  Tooltip,
} from "@heroui/react";
import QRCode from "qrcode.react";
import { MdSecurity, MdFingerprint, MdKey, MdOpenInNew } from "react-icons/md";

import {
  authenticateWebAuthn,
  isWebAuthnSupported,
  getSessionEncryptionKey,
} from "../lib/webauthn";
import { decryptData } from "../lib/crypto";
import { toast } from "../lib/toast";

interface QRModalProps {
  showQR: boolean;
  closeQR: () => void;
  otp: {
    Issuer: string;
    Label: string;
    Secret: string;
    Period: number;
  };
}

export function QRModal({ showQR, closeQR, otp }: QRModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [decryptedSecret, setDecryptedSecret] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Reset authentication state when modal opens/closes
  useEffect(() => {
    if (showQR) {
      setIsAuthenticated(false);
      setAuthError(null);
      setIsAuthenticating(false);
      setDecryptedSecret(null);
      setIsDecrypting(false);
    }
  }, [showQR]);

  const decryptSecret = async () => {
    try {
      setIsDecrypting(true);

      // Get the encryption key from WebAuthn session
      const encryptionKey = await getSessionEncryptionKey();

      // Parse the encrypted secret (format: "ciphertext.iv.authTag")
      const [ciphertext, iv, authTag] = otp.Secret.split(".");

      if (!ciphertext || !iv || !authTag) {
        throw new Error("Invalid encrypted secret format");
      }

      // Decrypt the secret
      const decrypted = await decryptData(
        {
          ciphertext,
          iv,
          authTag,
        },
        encryptionKey,
      );

      setDecryptedSecret(decrypted);
    } catch (error) {
      console.error("Failed to decrypt secret:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to decrypt secret";
      setAuthError(`Decryption failed: ${errorMessage}`);
      toast.error("Failed to decrypt secret for QR code");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!isWebAuthnSupported()) {
      toast.error("WebAuthn is not supported by this browser");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      await authenticateWebAuthn();
      setIsAuthenticated(true);
      toast.success("Authentication successful");

      // Decrypt the secret after successful authentication
      await decryptSecret();
    } catch (error) {
      console.error("WebAuthn authentication failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      setAuthError(errorMessage);
      toast.error("Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setAuthError(null);
    setIsAuthenticating(false);
    setDecryptedSecret(null);
    setIsDecrypting(false);
    closeQR();
  };

  // Only generate URI if we have the decrypted secret
  const otpauthUri = decryptedSecret
    ? `otpauth://totp/${encodeURIComponent(otp.Issuer + ":" + otp.Label)}?issuer=${encodeURIComponent(otp.Issuer)}&secret=${decryptedSecret}&algorithm=SHA1&digits=6&period=${otp.Period}`
    : "";

  const handleOpenUri = () => {
    if (!otpauthUri) {
      toast.error("Secret not yet decrypted");
      return;
    }

    try {
      // Try to open the URI directly - this will work if the device has an app registered for otpauth:// protocol
      window.open(otpauthUri, "_blank");
      toast.success("URI opened - check if your authenticator app imported it");
    } catch (error) {
      console.error("Failed to open URI:", error);
      toast.error("Failed to open URI - try scanning the QR code instead");
    }
  };

  const isReady = isAuthenticated && decryptedSecret && !isDecrypting;

  return (
    <Modal isOpen={showQR} placement="center" size="lg" onClose={handleClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Export QR Code</h2>
          <p className="text-sm text-default-500 font-normal">
            {isReady
              ? "Scan QR code or open URI to import to authenticator apps"
              : "Confirm your identity to view the QR code"}
          </p>
        </ModalHeader>

        <ModalBody className="gap-6">
          {!isReady ? (
            // Authentication required state
            <div className="flex flex-col items-center gap-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-warning-100 dark:bg-warning-900/20">
                  <MdSecurity className="w-12 h-12 text-warning-600" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDecrypting
                    ? "Decrypting Secret..."
                    : "Security Confirmation Required"}
                </h3>
                <p className="text-default-500 max-w-sm">
                  {isDecrypting
                    ? "Please wait while we decrypt your secret..."
                    : `Please authenticate with your passkey to view the QR code for ${otp.Issuer}.`}
                </p>
              </div>

              <div className="grid gap-3 w-full max-w-md">
                <Card className="bg-default-50 border border-default-200">
                  <CardBody className="flex flex-row items-center gap-3 py-3">
                    <MdKey className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-sm">Secure Export</p>
                      <p className="text-xs text-default-500">
                        QR code contains your secret key
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-default-50 border border-default-200">
                  <CardBody className="flex flex-row items-center gap-3 py-3">
                    <MdFingerprint className="w-5 h-5 text-success-600" />
                    <div>
                      <p className="font-medium text-sm">Biometric Security</p>
                      <p className="text-xs text-default-500">
                        TouchID, FaceID, or hardware security key
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-center">
                  <p className="text-danger-600 text-sm">{authError}</p>
                </div>
              )}
            </div>
          ) : (
            // QR code display state
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <QRCode size={256} value={otpauthUri} level="M" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-semibold">{otp.Issuer}</h3>
                <p className="text-sm text-default-500">{otp.Label}</p>
                <p className="text-xs text-default-400 max-w-md">
                  Scan this QR code with any TOTP authenticator app (Google
                  Authenticator, Authy, 1Password, etc.) to import your{" "}
                  {otp.Issuer} account.
                </p>
              </div>

              <Divider className="my-2" />

              <div className="w-full space-y-3">
                <div className="text-center">
                  <p className="text-sm font-medium text-default-600 mb-3">
                    Alternative Import Method
                  </p>
                </div>

                <div className="flex justify-center">
                  <Tooltip content="Open URI directly (if supported by your device)">
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<MdOpenInNew />}
                      onPress={handleOpenUri}
                    >
                      Open URI
                    </Button>
                  </Tooltip>
                </div>

                <div className="text-center">
                  <p className="text-xs text-default-400 max-w-lg">
                    The "Open URI" button will try to open your default
                    authenticator app automatically. If it doesn't work, use the
                    QR code instead.
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            Cancel
          </Button>
          {!isAuthenticated && (
            <Button
              color="primary"
              isLoading={isAuthenticating || isDecrypting}
              startContent={
                !isAuthenticating && !isDecrypting && <MdFingerprint />
              }
              onPress={handleAuthenticate}
            >
              {isAuthenticating
                ? "Authenticating..."
                : isDecrypting
                  ? "Decrypting..."
                  : "Authenticate"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
