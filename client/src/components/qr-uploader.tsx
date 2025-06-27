import React, { useState, useRef, useCallback } from "react";
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
import { FiUpload, FiImage } from "react-icons/fi";
import QrScanner from "qr-scanner";

import { toast } from "../lib/toast";

interface QRImageUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRImageUploaderModal({ isOpen, onClose }: QRImageUploaderModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseOTPAuth = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.protocol !== 'otpauth:') {
        throw new Error('Not an OTP Auth URL');
      }

      const type = urlObj.host;
      if (type !== 'totp') {
        throw new Error('Only TOTP is supported');
      }

      const pathParts = urlObj.pathname.split('/');
      const label = decodeURIComponent(pathParts[1] || '');
      
      const params = new URLSearchParams(urlObj.search);
      const secret = params.get('secret');
      const issuer = params.get('issuer') || label.split(':')[0] || 'Unknown';
      const algorithm = params.get('algorithm') || 'SHA1';
      const digits = params.get('digits') || '6';
      const period = params.get('period') || '30';

      if (!secret) {
        throw new Error('Secret is required');
      }

      return {
        secret,
        issuer,
        label: label.includes(':') ? label.split(':')[1] : label,
        algorithm,
        digits,
        period,
      };
    } catch (error) {
      console.error('Failed to parse OTP Auth URL:', error);
      throw error;
    }
  }, []);

  const handleQrCodeScan = useCallback((data: string) => {
    try {
      const otpData = parseOTPAuth(data);
      toast.success(`QR code found: ${otpData.issuer}`);
      
      // Here you would typically open the add OTP modal with pre-filled data
      // For now, we'll just show a success message and close
      
      onClose();
    } catch (error) {
      console.error("Error parsing OTP QR Code:", error);
      toast.error(`Invalid QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [parseOTPAuth, onClose]);

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    try {
      const result = await QrScanner.scanImage(file);
      handleQrCodeScan(result);
    } catch (error) {
      console.error('Error scanning image:', error);
      toast.error('No QR code found in image');
    } finally {
      setIsProcessing(false);
    }
  }, [handleQrCodeScan]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    processImage(file);
  }, [processImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>Upload QR Code Image</ModalHeader>
        <ModalBody>
          <Card
            className={`border-2 border-dashed cursor-pointer transition-colors ${
              dragActive ? 'border-primary bg-primary-50' : 'border-default-300 hover:border-default-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleFileInputClick}
          >
            <CardBody className="text-center py-12">
              <div className="space-y-4">
                <div className="text-4xl text-default-400">
                  <FiUpload className="mx-auto" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drop your QR code image here</p>
                  <p className="text-sm text-default-500">or click to browse</p>
                </div>
                <div className="flex justify-center">
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<FiImage />}
                    isLoading={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Select Image'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
          
          <p className="text-xs text-default-500 text-center">
            Supported formats: PNG, JPEG, GIF, WebP
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
