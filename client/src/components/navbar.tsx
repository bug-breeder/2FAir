import {
  Button,
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  Tooltip,
} from "@heroui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdLock, MdSettings } from "react-icons/md";

import { useVault } from "../providers/vault-provider";

import { Logo } from "./logo";

export function Navbar() {
  const { t } = useTranslation();
  const { lock } = useVault();
  const { pathname } = useLocation();

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarBrand>
        <RouterLink className="flex items-center gap-2 text-foreground" to="/">
          <Logo compact className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="font-display text-xl font-bold tracking-tight">
            2FAir
          </span>
        </RouterLink>
      </NavbarBrand>
      <NavbarContent className="gap-1" justify="end">
        {pathname !== "/settings" && (
          <Tooltip content={t("home.settings")}>
            <Button
              isIconOnly
              aria-label={t("home.settings")}
              as={RouterLink}
              radius="full"
              to="/settings"
              variant="light"
            >
              <MdSettings className="text-2xl text-default-500" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content={t("home.lock")}>
          <Button
            isIconOnly
            aria-label={t("home.lock")}
            radius="full"
            variant="light"
            onPress={lock}
          >
            <MdLock className="text-2xl text-default-500" />
          </Button>
        </Tooltip>
      </NavbarContent>
    </HeroUINavbar>
  );
}
