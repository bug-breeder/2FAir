import { Switch } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { MoonFilledIcon, SunFilledIcon } from "./icons";

export function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Switch
      defaultSelected={theme === "dark"}
      size="lg"
      color="primary"
      thumbIcon={({ isSelected, className }) =>
        isSelected ? (
          <MoonFilledIcon className={className} />
        ) : (
          <SunFilledIcon className={className} />
        )
      }
      onChange={(isSelected) => setTheme(isSelected ? "dark" : "light")}
    />
  );
}
