import React, { useRef, useEffect, useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import {
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { RiVipCrown2Fill } from "react-icons/ri";
import { MdSecurity, MdSettings, MdLogout, MdHelp } from "react-icons/md";
import { SiWebauthn } from "react-icons/si";

import { siteConfig } from "../config/site";
import { useAuth } from "../providers/auth-provider";
import { useSearch } from "../providers/search-provider";
import { useListOtps } from "../hooks/otp";
import { toast } from "../lib/toast";

import { FAir, SearchIcon } from "./icons";
import { ThemeSwitch } from "./theme-switch";
import WebAuthnRegistrationModal from "./webauthn-registration-modal";

export const Navbar = () => {
  const searchRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWebAuthnRegistration, setShowWebAuthnRegistration] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { searchQuery, setSearchQuery, clearSearch, isSearchActive } = useSearch();
  const { data: otps = [] } = useListOtps();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  const handleWebAuthnRegistration = () => {
    setShowWebAuthnRegistration(true);
  };

  const handleWebAuthnRegistrationSuccess = () => {
    setShowWebAuthnRegistration(false);
    toast.success("WebAuthn credential registered successfully!");
  };

  const handleSearch = (searchTerm: string) => {
    const trimmedTerm = searchTerm.trim();
    setSearchQuery(trimmedTerm);
  };

  const searchInput = (
    <Input
      ref={searchRef}
      aria-label="Search OTPs"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search your OTPs..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleSearch(e.currentTarget.value);
        }
        if (e.key === "Escape") {
          clearSearch();
          if (searchRef.current) {
            searchRef.current.value = "";
          }
        }
      }}
    />
  );

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  // Don't show navbar on login page
  if (!isAuthenticated) {
    return null;
  }

  return (
    <HeroUINavbar
      className="border-b border-divider"
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-2"
            color="foreground"
            href="/"
            onClick={() => navigate("/")}
          >
            <FAir size={32} />
            <div className="flex flex-col">
              <p className="font-bold text-inherit">2FAir</p>
            </div>
          </Link>
        </NavbarBrand>

        {/* OTP Count Badge */}
        {Array.isArray(otps) && otps.length > 0 && (
          <NavbarItem className="hidden sm:flex">
            <Chip
              color="primary"
              size="sm"
              startContent={<MdSecurity className="text-sm" />}
              variant="flat"
            >
              {otps.length} OTP{otps.length !== 1 ? "s" : ""}
            </Chip>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>

        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>

        <NavbarItem className="hidden md:flex">
          <Button
            isExternal
            as={Link}
            className="text-sm font-normal text-default-600 bg-default-100"
            href={siteConfig.links.sponsor}
            size="sm"
            startContent={<RiVipCrown2Fill className="text-warning" />}
            variant="flat"
          >
            Support
          </Button>
        </NavbarItem>

        {/* User Avatar Dropdown */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                showFallback
                as="button"
                className="transition-transform hover:scale-105"
                color="primary"
                name={user?.name || user?.email || "User"}
                size="sm"
                src={user?.picture}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold text-primary">{user?.email}</p>
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<MdSettings className="text-lg" />}
                onPress={() => navigate("/settings")}
              >
                Settings
              </DropdownItem>
              <DropdownItem
                key="security"
                startContent={<MdSecurity className="text-lg" />}
                onPress={() => navigate("/security")}
              >
                Security
              </DropdownItem>
              <DropdownItem
                key="webauthn"
                startContent={<SiWebauthn className="text-lg" />}
                onPress={handleWebAuthnRegistration}
              >
                Setup WebAuthn
              </DropdownItem>
              <DropdownItem
                key="help"
                startContent={<MdHelp className="text-lg" />}
                onPress={() => window.open(siteConfig.links.docs, "_blank")}
              >
                Help & Support
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<MdLogout className="text-lg" />}
                onPress={handleLogout}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 mb-4">{searchInput}</div>

        {/* User Info in Mobile Menu */}
        <div className="mx-4 mb-4 p-3 bg-default-100 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar
              showFallback
              name={user?.name || user?.email || "User"}
              size="sm"
              src={user?.picture}
            />
            <div>
              <p className="font-semibold text-sm">{user?.name || "User"}</p>
              <p className="text-xs text-default-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="mx-4 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link
                className="w-full"
                color={
                  index === siteConfig.navMenuItems.length - 1
                    ? "danger"
                    : "foreground"
                }
                href={item.href}
                size="lg"
                onPress={() => {
                  if (item.href === "/logout") {
                    handleLogout();
                  } else {
                    navigate(item.href);
                  }
                  setIsMenuOpen(false);
                }}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}

          {/* Logout in mobile menu */}
          <NavbarMenuItem>
            <Link
              className="w-full"
              color="danger"
              size="lg"
              onPress={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
            >
              Log Out
            </Link>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>

      {/* WebAuthn Registration Modal */}
      <WebAuthnRegistrationModal
        isOpen={showWebAuthnRegistration}
        onClose={() => setShowWebAuthnRegistration(false)}
        onSuccess={handleWebAuthnRegistrationSuccess}
      />
    </HeroUINavbar>
  );
};
