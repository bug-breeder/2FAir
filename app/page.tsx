"use client";
import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import { useTheme } from "next-themes";
import OTPCard from "@/components/otp-card";

const generateCode = () => {
  // Function to generate a new OTP code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default function Home() {
  const { theme, setTheme } = useTheme();

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
      {/* <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>Make&nbsp;</h1>
        <h1 className={title({ color: "violet" })}>beautiful&nbsp;</h1>
        <br />
        <h1 className={title()}>
          websites regardless of your design experience.
        </h1>
        <h2 className={subtitle({ class: "mt-4" })}>
          Beautiful, fast and modern React UI library.
        </h2>
      </div>

      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={siteConfig.links.docs}
        >
          Documentation
        </Link>
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          GitHub
        </Link>
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="flat">
          <span>
            Get started by editing <Code color="primary">app/page.tsx</Code>
          </span>
        </Snippet>
      </div> */}

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-5">
        {otps.map((otp, index) => (
          <OTPCard key={index} otp={otp} />
        ))}
      </div>
    </section>
  );
}
