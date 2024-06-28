"use client";
import OTPCard from "@/components/otp-card";

export default function Home() {
  const otps = [
    {
      issuer: "Google",
      label: "abcdkmlkafnguyentranvietanh@gmail.com",
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
      issuer: "LinkedIn",
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

  return (
    <section className="flex flex-col items-center justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-5">
        {otps.map((otp, index) => (
          <OTPCard key={index} otp={otp} />
        ))}
      </div>
    </section>
  );
}
