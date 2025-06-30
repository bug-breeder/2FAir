import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Switch,
  Divider,
  Chip,
  Select,
  SelectItem,
} from "@heroui/react";
import { MdSettings, MdStorage, MdNotifications, MdRefresh, MdLanguage, MdDownload, MdSecurity } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import DefaultLayout from "@/layouts/default";
import { toast } from "@/lib/toast";
import { apiClient } from "@/lib/api/client";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // App preferences state
  const [preferences, setPreferences] = useState({
    autoRefresh: true,
    showNotifications: true,
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Language settings state
  const getCurrentLanguageSetting = () => {
    const saved = localStorage.getItem('i18nextLng');
    return saved === null || saved === 'auto' ? 'auto' : saved;
  };

  const [languageSetting, setLanguageSetting] = useState(getCurrentLanguageSetting());

  const handlePreferencesUpdate = async () => {
    setIsSavingPreferences(true);
    try {
      await apiClient.put("/api/v1/user/preferences", preferences);
      toast.success(t('settings.preferencesSaved'));
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error(t('settings.failedToSave'));
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguageSetting(value);
    
    if (value === 'auto') {
      localStorage.removeItem('i18nextLng');
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = ['en', 'vi'].includes(browserLang) ? browserLang : 'en';
      i18n.changeLanguage(supportedLang);
    } else {
      i18n.changeLanguage(value);
    }
  };

  const languageOptions = [
    { key: 'auto', label: t('language.autoDetect') },
    { key: 'en', label: t('language.english') },
    { key: 'vi', label: t('language.vietnamese') },
  ];

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center px-4 sm:px-0">
        {/* Header */}
        <div className="w-full max-w-md sm:max-w-none mx-auto mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10">
              <MdSettings className="text-lg text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-default-700">{t('settings.title')}</h1>
              <p className="text-small text-default-500">Customize your experience and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* App Preferences */}
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <MdSettings className="text-medium text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{t('settings.appPreferences.title')}</h2>
                    <p className="text-small text-default-500">Configure app behavior and interface</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0 space-y-4">
                {/* Language Setting */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-default-50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10 flex-shrink-0">
                      <MdLanguage className="text-small text-secondary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-medium font-semibold">{t('settings.language.title')}</p>
                      <p className="text-tiny text-default-500">Change app language</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Select
                      size="sm"
                      selectedKeys={[languageSetting]}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        handleLanguageChange(selectedKey);
                      }}
                      className="w-32"
                      classNames={{
                        trigger: "h-9 min-h-9",
                      }}
                    >
                      {languageOptions.map((option) => (
                        <SelectItem key={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Auto-refresh Setting */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-default-50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10 flex-shrink-0">
                      <MdRefresh className="text-small text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-medium font-semibold">{t('settings.appPreferences.autoRefresh.title')}</p>
                      <p className="text-tiny text-default-500">Automatically refresh OTP codes</p>
                    </div>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={preferences.autoRefresh}
                    onValueChange={(value) => setPreferences({ ...preferences, autoRefresh: value })}
                    classNames={{
                      wrapper: "group-data-[selected=true]:bg-success",
                    }}
                  />
                </div>

                {/* Notifications Setting */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-default-50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                      <MdNotifications className="text-small text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-medium font-semibold">{t('settings.appPreferences.notifications.title')}</p>
                      <p className="text-tiny text-default-500">Show app notifications</p>
                    </div>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={preferences.showNotifications}
                    onValueChange={(value) => setPreferences({ ...preferences, showNotifications: value })}
                    classNames={{
                      wrapper: "group-data-[selected=true]:bg-success",
                    }}
                  />
                </div>

                {/* Auto-backup Info */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10 flex-shrink-0">
                      <MdStorage className="text-small text-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-medium font-semibold text-success">{t('settings.appPreferences.autoBackup.title')}</p>
                      <p className="text-tiny text-success/70">Automatic backups are enabled</p>
                    </div>
                  </div>
                  <Chip size="sm" color="success" variant="flat">
                    {t('common.active')}
                  </Chip>
                </div>

                {/* Save Button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    color="success"
                    size="sm"
                    className="font-medium"
                    isLoading={isSavingPreferences}
                    onPress={handlePreferencesUpdate}
                  >
                    {t('settings.savePreferences')}
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Data Management */}
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10">
                    <MdStorage className="text-medium text-warning" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{t('settings.dataManagement.title')}</h2>
                    <p className="text-small text-default-500">Export data and manage security settings</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0 space-y-4">
                {/* Export Data */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-default-50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                      <MdDownload className="text-small text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-medium font-semibold">{t('settings.dataManagement.exportData.title')}</p>
                      <p className="text-tiny text-default-500">Download your OTP codes and settings</p>
                    </div>
                  </div>
                  <Button
                    color="success"
                    variant="bordered"
                    size="sm"
                    className="font-medium shrink-0"
                    onPress={() => navigate("/export")}
                  >
                    {t('common.export')}
                  </Button>
                </div>

                {/* Security Settings */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-default-50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-danger/10 flex-shrink-0">
                      <MdSecurity className="text-small text-danger" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-medium font-semibold">{t('settings.dataManagement.securitySettings.title')}</p>
                      <p className="text-tiny text-default-500">Manage WebAuthn and sessions</p>
                    </div>
                  </div>
                  <Button
                    color="success"
                    variant="bordered"
                    size="sm"
                    className="font-medium shrink-0"
                    onPress={() => navigate("/security")}
                  >
                    {t('navigation.security')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
} 