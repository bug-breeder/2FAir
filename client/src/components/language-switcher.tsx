import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { MdCheck } from "react-icons/md";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "auto", name: "Auto Detect" },
    { code: "en", name: t("language.english") },
    { code: "vi", name: t("language.vietnamese") },
  ];

  const getCurrentLanguage = () => {
    const saved = localStorage.getItem("i18nextLng");
    if (!saved || saved === "auto") {
      return languages[0]; // Auto detect
    }
    return languages.find((lang) => lang.code === saved) || languages[1]; // Default to EN
  };

  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (languageCode: string) => {
    if (languageCode === "auto") {
      localStorage.removeItem("i18nextLng");
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      const supportedLang = ["en", "vi"].includes(browserLang)
        ? browserLang
        : "en";
      i18n.changeLanguage(supportedLang);
    } else {
      i18n.changeLanguage(languageCode);
    }
    setIsOpen(false);
  };

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
      <DropdownTrigger>
        <Button
          variant="light"
          size="sm"
          className="min-w-0 px-2 font-mono text-xs"
        >
          {currentLanguage.code}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={t("language.title")}
        selectionMode="single"
        selectedKeys={new Set([currentLanguage.code])}
      >
        {languages.map((language) => (
          <DropdownItem
            key={language.code}
            onPress={() => handleLanguageChange(language.code)}
          >
            {language.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
