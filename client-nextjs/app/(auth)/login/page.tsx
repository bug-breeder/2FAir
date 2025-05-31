"use client";

import React from "react";
import { Button, Divider, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { FAir } from "@/components/icons";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function Login() {
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async (provider: string) => {
    try {
      await login(provider);
    } catch (error) {
      toast.error("Failed to initiate login. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-6 sm:px-0">
      <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-4 sm:px-8 py-6 shadow-small">
        <div className="flex flex-col items-center pb-1">
          <FAir size={60} />
          <h1 className="text-xl font-medium mt-4">Welcome Back</h1>
          <p className="text-small text-default-500">
            Log in to your account to continue
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="logos:google-icon" width={24} />}
            variant="bordered"
            onPress={() => handleLogin("google")}
            isLoading={isLoading}
            disabled={isLoading}
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
            onPress={() => handleLogin("microsoft")}
            isLoading={isLoading}
            disabled={isLoading}
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
          <Link href="/recovery" size="sm">
            Recovery
          </Link>
        </p>
      </div>
    </div>
  );
}
