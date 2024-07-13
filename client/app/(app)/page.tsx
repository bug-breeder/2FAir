"use client";
import Backdrop from "@/components/backdrop";
import FAB from "@/components/fab";
import OTPCard from "@/components/otp-card";
import { useState } from "react";

export default function Home() {
  const otps = [
    {
      issuer: "Steam",
      label: "abcdkmlkafnvnh@gmail.com",
      secret: "NB2W45DFOIZA",
      period: 30,
    },
    {
      issuer: "Google",
      label: "jane@gmail.com",
      secret: "NB2W45DFOIZA",
      period: 30,
    },
    {
      issuer: "Facebook",
      label: "john@gmail.com",
      secret: "NB2W45DFOIZA",
      period: 30,
    },
    {
      issuer: "Amazon",
      label: "john@gmail.com",
      secret: "NB2W45DFOIZA",
      period: 30,
    },
    {
      issuer: "Twitter",
      label: "john@gmail.com",
      secret: "NB2W45DFOIZA",
      period: 60,
    },
    {
      issuer: "Epic Games",
      label: "john@gmail.com",
      secret: "NB2W45DFOIZA",
      period: 30,
    },
    {
      issuer: "Apple",
      label: "john@gmail.com",
      secret: "NB2W45DFOIZA",
      period: 30,
    },
    {
      issuer: "Microsoft",
      label: "john@gmail.com",
      secret: "NB2W45DFOIZA",
      period: 30,
    },
  ];

  const [activeMenu, setActiveMenu] = useState<{
    idx: number;
    x: number;
    y: number;
  } | null>(null);

  const handleOpenMenu = (idx: number, x: number, y: number) => {
    setActiveMenu({ idx, x, y });
  };

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  return (
    <section className="flex flex-col items-center justify-center">
      {/* {activeMenu && <Backdrop onClick={handleCloseMenu} />}{" "} */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-5">
        {otps.map((otp, index) => (
          <OTPCard
            key={index}
            otp={otp}
            isActive={activeMenu?.idx === index}
            activeMenu={activeMenu}
            setActiveMenu={(x, y) => handleOpenMenu(index, x, y)}
            closeMenu={handleCloseMenu}
          />
        ))}
      </div>
      <FAB />
    </section>
  );
}
