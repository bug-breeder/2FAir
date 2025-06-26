import { useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
} from "@heroui/react";
import { SiWebauthn } from "react-icons/si";
import { MdSecurity, MdKey, MdFingerprint, MdCheckCircle } from "react-icons/md";

import { registerWebAuthnCredential, isWebAuthnSupported } from "../lib/webauthn";
import { toast } from "../lib/toast";

interface WebAuthnRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WebAuthnRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: WebAuthnRegistrationModalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState<'intro' | 'registering' | 'success'>('intro');

  const handleRegister = useCallback(async () => {
    if (!isWebAuthnSupported()) {
      toast.error("WebAuthn is not supported in this browser");
      return;
    }

    try {
      setIsRegistering(true);
      setStep('registering');

      // Register WebAuthn credential
      await registerWebAuthnCredential();
      
      setStep('success');
      toast.success("WebAuthn credential registered successfully!");
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('WebAuthn registration failed:', error);
      toast.error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStep('intro');
    } finally {
      setIsRegistering(false);
    }
  }, [onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!isRegistering) {
      setStep('intro');
      onClose();
    }
  }, [isRegistering, onClose]);

  return (
    <Modal 
      isOpen={isOpen} 
      placement="center" 
      onOpenChange={handleClose}
      isDismissable={!isRegistering}
      hideCloseButton={isRegistering}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <SiWebauthn className="w-5 h-5 text-primary-600" />
            <span>Setup WebAuthn Security</span>
          </div>
          <p className="text-sm text-default-500 font-normal">
            Register your authenticator to enable encrypted TOTP storage
          </p>
        </ModalHeader>

        <ModalBody>
          {step === 'intro' && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                  <MdCheckCircle className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold">Zero-Knowledge Encryption</h3>
                <p className="text-default-600">
                  WebAuthn credentials are used to derive encryption keys for your TOTP secrets. 
                  Your data is encrypted client-side and we never have access to your unencrypted secrets.
                </p>
              </div>

              <div className="grid gap-3">
                <Card className="bg-default-50 border border-default-200">
                  <CardBody className="flex flex-row items-center gap-3 py-3">
                    <MdKey className="w-5 h-5 text-warning-600" />
                    <div>
                      <p className="font-medium text-sm">Encryption Keys</p>
                      <p className="text-xs text-default-500">
                        Derived from your WebAuthn credential
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
                        TouchID, FaceID, or hardware security keys
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-default-50 border border-default-200">
                  <CardBody className="flex flex-row items-center gap-3 py-3">
                    <MdSecurity className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-sm">Zero-Knowledge</p>
                      <p className="text-xs text-default-500">
                        We never see your unencrypted TOTP secrets
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {!isWebAuthnSupported() && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-md">
                  <p className="text-sm text-danger-700">
                    <strong>WebAuthn not supported:</strong> Your browser doesn't support WebAuthn.
                    Please use a modern browser with WebAuthn support.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'registering' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-warning-100 rounded-full flex items-center justify-center animate-pulse">
                <SiWebauthn className="w-8 h-8 text-warning-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Follow your browser's prompts</h3>
                <p className="text-default-600 mb-4">
                  Complete the WebAuthn registration using your authenticator (TouchID, FaceID, or security key).
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-warning-100 text-warning-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></div>
                  Waiting for authenticator...
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center">
                <MdCheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success-700 mb-2">Registration Complete!</h3>
                <p className="text-default-600">
                  Your WebAuthn credential has been registered successfully. 
                  You can now add encrypted TOTP secrets to your vault.
                </p>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 'intro' && (
            <>
              <Button 
                color="danger" 
                variant="light" 
                onPress={handleClose}
                isDisabled={isRegistering}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleRegister}
                isDisabled={!isWebAuthnSupported()}
                startContent={<SiWebauthn className="w-4 h-4" />}
              >
                Register WebAuthn
              </Button>
            </>
          )}

          {step === 'registering' && (
            <Button 
              color="warning" 
              isLoading
              isDisabled
            >
              Registering...
            </Button>
          )}

          {step === 'success' && (
            <Button 
              color="success" 
              variant="light"
              onPress={() => {
                onSuccess();
                onClose();
              }}
            >
              Continue
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 