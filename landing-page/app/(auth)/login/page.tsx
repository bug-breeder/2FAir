"use client";

import React from "react";
import { Button, Divider, Link } from "@nextui-org/react";
import { Icon } from "@iconify/react";

import { FAir } from "@/components/icons";

export default function Login() {
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div className="flex h-full  w-full flex-col items-center justify-center px-6 sm:px-0">
      <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-4 sm:px-8 py-6 shadow-small">
        <div className="flex flex-col items-center pb-1">
          <FAir size={60} />
          <p className="text-xl font-medium mt-4">Welcome Back</p>
          <p className="text-small text-default-500">
            Log in to your account to continue
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="logos:google-icon" width={24} />}
            variant="bordered"
          >
            Continue with Google
          </Button>
          <Button
            startContent={
              <Icon
                className="text-default-500"
                icon="logos:microsoft-icon"
                width={24}
              />
            }
            variant="bordered"
          >
            Continue with Microsoft
          </Button>
        </div>
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="shrink-0 text-tiny text-default-500">OR</p>
          <Divider className="flex-1" />
        </div>

        <p className="text-center text-small">
          Can not access your account?&nbsp;
          <Link href="#" size="sm">
            Recovery
          </Link>
        </p>
      </div>
    </div>
  );
}
