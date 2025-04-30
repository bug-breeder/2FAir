"use client";
import React, { useRef, useEffect } from "react";
import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import {
  Avatar,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { FAir, HeartFilledIcon, SearchIcon } from "@/components/icons";
import { RiVipCrown2Fill } from "react-icons/ri";
import { useLogout } from "@/hooks/auth"; // Import the useLogout hook

export const Navbar = () => {
  const searchRef = useRef<HTMLInputElement>(null);
  const logoutMutation = useLogout(); // Initialize the logout mutation

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Redirect to the login page or any other page after logout
        window.location.href = "/auth/login";
      },
      onError: (error) => {
        console.error("Logout failed:", error);
        // Optionally handle the error, e.g., show a notification
      },
    });
  };

  const searchInput = (
    <Input
      aria-label="Search"
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
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
      ref={searchRef}
    />
  );

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <FAir />
            <p className="font-bold text-inherit">2FAir</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
          <Link
            isExternal
            aria-label="Upgrade"
            className="hidden md:flex lg:hidden"
            href={siteConfig.links.sponsor}
          >
            <HeartFilledIcon className="text-danger" />
          </Link>
        </NavbarItem>
        <NavbarItem className="hidden lg:flex">
          <Button
            isExternal
            as={Link}
            className="text-sm font-normal text-default-600 bg-default-100"
            href={siteConfig.links.sponsor}
            startContent={<RiVipCrown2Fill />}
            variant="flat"
          >
            Upgrade
          </Button>
        </NavbarItem>
        <NavbarItem className="hidden md:flex">{searchInput}</NavbarItem>
        <Dropdown>
          <DropdownTrigger className="min-w-160">
            <Avatar
              src="https://i.pravatar.cc/149?u=a042581f4e29026024d"
              size="md"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="User menu">
            <DropdownItem key="settings">Settings</DropdownItem>
            <DropdownItem key="logout" onClick={handleLogout}>
              Logout
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <Link
          isExternal
          aria-label="Sponsor"
          className="md:hidden"
          href={siteConfig.links.sponsor}
        >
          <HeartFilledIcon className="text-danger" />
        </Link>
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link
                color={
                  index === 2
                    ? "primary"
                    : index === siteConfig.navMenuItems.length - 1
                      ? "danger"
                      : "foreground"
                }
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
