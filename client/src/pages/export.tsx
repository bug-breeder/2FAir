import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Checkbox,
  Divider,
  Progress,
  Chip,
} from "@heroui/react";
import { MdDownload, MdStorage, MdSecurity, MdInfo } from "react-icons/md";
import { useTranslation } from "react-i18next";

import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/providers/auth-provider";
import { useListOtps } from "@/hooks/otp";
import { toast } from "@/lib/toast";
import { apiClient } from "@/lib/api/client";
import { OTP } from "@/types/otp";

export default function ExportPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: otps = [] } = useListOtps();

  // Type assertion for otps array
  const typedOtps = otps as OTP[];

  const [exportOptions, setExportOptions] = useState({
    includeOtps: true,
    includeSettings: true,
    includeMetadata: false,
    format: "json",
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (!exportOptions.includeOtps && !exportOptions.includeSettings) {
      toast.error(t("export.errors.selectData"));
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Create export data
      const exportData: any = {
        metadata: {
          exported_at: new Date().toISOString(),
          exported_by: user?.email,
          version: "1.0",
          app: "2FAir",
        },
      };

      if (exportOptions.includeOtps) {
        exportData.otps = typedOtps.map((otp: OTP) => ({
          id: otp.Id,
          issuer: otp.Issuer,
          label: otp.Label,
          secret: otp.Secret,
          period: otp.Period,
        }));
      }

      if (exportOptions.includeSettings) {
        // In a real app, this would fetch user settings from the API
        exportData.settings = {
          autoRefresh: true,
          showNotifications: true,
          defaultView: "grid",
          autoBackup: false,
        };
      }

      if (!exportOptions.includeMetadata) {
        delete exportData.metadata;
      }

      // Complete progress
      clearInterval(progressInterval);
      setExportProgress(100);

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `2fair-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("export.success.exported"));
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error(t("export.errors.exportFailed"));
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleBackupToCloud = async () => {
    try {
      await apiClient.post("/api/v1/backup/create", {
        include_otps: exportOptions.includeOtps,
        include_settings: exportOptions.includeSettings,
      });

      toast.success(t("export.success.backedUp"));
    } catch (error) {
      console.error("Failed to create backup:", error);
      toast.error(t("export.errors.exportFailed"));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const estimatedSize = JSON.stringify({
    otps: exportOptions.includeOtps ? typedOtps : [],
    settings: exportOptions.includeSettings ? {} : undefined,
    metadata: exportOptions.includeMetadata ? {} : undefined,
  }).length;

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center px-4 sm:px-0">
        {/* Header */}
        <div className="w-full max-w-md sm:max-w-none mx-auto mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <MdDownload className="text-lg text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-default-700">
                {t("export.title")}
              </h1>
              <p className="text-small text-default-500">
                Download your OTP codes and settings securely
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Export Options */}
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10">
                    <MdStorage className="text-medium text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {t("export.options.title")}
                    </h2>
                    <p className="text-small text-default-500">
                      Choose what data to include in your export
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-default-50">
                    <Checkbox
                      size="sm"
                      isSelected={exportOptions.includeOtps}
                      onValueChange={(value) =>
                        setExportOptions({
                          ...exportOptions,
                          includeOtps: value,
                        })
                      }
                      classNames={{
                        wrapper: "group-data-[selected=true]:bg-success",
                      }}
                    />
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10 flex-shrink-0">
                        <MdSecurity className="text-small text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-medium font-semibold">
                          {t("export.options.otpCodes.title")}
                        </p>
                        <p className="text-tiny text-default-500">
                          {t("export.options.otpCodes.description", {
                            count: typedOtps.length,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-default-50">
                    <Checkbox
                      size="sm"
                      isSelected={exportOptions.includeSettings}
                      onValueChange={(value) =>
                        setExportOptions({
                          ...exportOptions,
                          includeSettings: value,
                        })
                      }
                      classNames={{
                        wrapper: "group-data-[selected=true]:bg-success",
                      }}
                    />
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10 flex-shrink-0">
                        <MdStorage className="text-small text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-medium font-semibold">
                          {t("export.options.appSettings.title")}
                        </p>
                        <p className="text-tiny text-default-500">
                          Your app preferences and configuration
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-default-50">
                    <Checkbox
                      size="sm"
                      isSelected={exportOptions.includeMetadata}
                      onValueChange={(value) =>
                        setExportOptions({
                          ...exportOptions,
                          includeMetadata: value,
                        })
                      }
                      classNames={{
                        wrapper: "group-data-[selected=true]:bg-success",
                      }}
                    />
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                        <MdInfo className="text-small text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-medium font-semibold">
                          {t("export.options.metadata.title")}
                        </p>
                        <p className="text-tiny text-default-500">
                          Timestamp and version information
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider className="my-3" />

                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-default-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-medium font-semibold">
                      {t("export.options.estimatedSize.title")}
                    </p>
                    <p className="text-tiny text-default-500">
                      Based on current selections
                    </p>
                  </div>
                  <Chip size="sm" variant="flat" color="primary">
                    {formatFileSize(estimatedSize)}
                  </Chip>
                </div>
              </CardBody>
            </Card>

            {/* Export Actions */}
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
                    <MdDownload className="text-medium text-success" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {t("export.actions.title")}
                    </h2>
                    <p className="text-small text-default-500">
                      Download or backup your data
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0 space-y-4">
                {isExporting && (
                  <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex justify-between text-small">
                      <span className="font-medium text-primary">
                        {t("export.actions.downloading")}
                      </span>
                      <span className="text-primary">{exportProgress}%</span>
                    </div>
                    <Progress
                      value={exportProgress}
                      color="primary"
                      size="sm"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    color="success"
                    size="sm"
                    startContent={<MdDownload className="text-small" />}
                    onPress={handleExport}
                    isLoading={isExporting}
                    className="w-full sm:w-auto font-medium"
                  >
                    {t("export.actions.downloadExport")}
                  </Button>

                  <Button
                    color="secondary"
                    variant="bordered"
                    size="sm"
                    startContent={<MdStorage className="text-small" />}
                    onPress={handleBackupToCloud}
                    className="w-full sm:w-auto font-medium"
                  >
                    {t("export.actions.backupToCloud")}
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Security Notice */}
            <Card className="w-full border-danger/20 bg-danger/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-danger/10">
                    <MdSecurity className="text-medium text-danger" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-danger">
                      {t("export.security.title")}
                    </h2>
                    <p className="text-small text-danger/70">
                      Important security information
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-3 p-3 rounded-lg bg-danger/10 border border-danger/20">
                  <p className="text-small text-danger font-medium">
                    {t("export.security.warning")}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-tiny text-danger/70">
                    {(
                      t("export.security.tips", {
                        returnObjects: true,
                      }) as string[]
                    ).map((tip: string, index: number) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>

            {/* Export History */}
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10">
                    <MdStorage className="text-medium text-warning" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {t("export.history.title")}
                    </h2>
                    <p className="text-small text-default-500">
                      Your export history
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="text-center py-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warning/10 mx-auto mb-4">
                    <MdDownload className="text-xl text-warning/50" />
                  </div>
                  <p className="text-medium font-semibold text-default-600 mb-2">
                    {t("export.history.empty")}
                  </p>
                  <p className="text-small text-default-500">
                    {t("export.history.emptyDescription")}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}
