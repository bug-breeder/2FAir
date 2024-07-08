"use client";

import React from "react";
import { Button, Link } from "@nextui-org/react";
import { Icon } from "@iconify/react";

import { FAir } from "@/components/icons";

export default function Component() {
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div className="flex h-full  w-full flex-col items-center justify-center">
      <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 py-6 shadow-small">
        <div className="flex flex-col items-center pb-2">
          <FAir size={60} />
          <p className="text-xl font-medium mt-4">Welcome Back</p>
          <p className="text-small text-default-500">
            Log in to your account to continue
          </p>
        </div>
        {/* <form
          className="flex flex-col gap-3"
          onSubmit={(e) => e.preventDefault()}
        > */}
        {/* <Input
            label="Email Address"
            name="email"
            placeholder="Enter your email"
            type="email"
            variant="bordered"
          /> */}
        {/* <Input
            endContent={
              <button type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <Icon
                    className="pointer-events-none text-2xl text-default-400"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="pointer-events-none text-2xl text-default-400"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            label="Password"
            name="password"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
            variant="bordered"
          /> */}
        {/* <div className="flex items-center justify-between px-1 py-2">
            <Checkbox name="remember" size="sm">
              Remember me
            </Checkbox>
            <Link className="text-default-500" href="#" size="sm">
              Forgot password?
            </Link>
          </div> */}
        {/* <Button color="primary" type="submit">
            Log In
          </Button> */}
        {/* </form> */}
        {/* <div className="flex items-center gap-4"> */}
        {/* <Divider className="flex-1" />
          <p className="shrink-0 text-tiny text-default-500">OR</p>
          <Divider className="flex-1" /> */}
        {/* </div> */}
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
        <p className="text-center text-small">
          Can't access your account?&nbsp;
          <Link href="#" size="sm">
            Recovery
          </Link>
        </p>
      </div>
    </div>
  );
}
