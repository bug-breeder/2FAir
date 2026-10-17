import { useState } from "react";
import { Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaPlus } from "react-icons/fa";
import { LuCamera, LuFileImage, LuKeyboard } from "react-icons/lu";

interface FabProps {
  onScan: () => void;
  onUpload: () => void;
  onManual: () => void;
}

export function FAB({ onScan, onUpload, onManual }: FabProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const actions = [
    { label: t("add.scan"), icon: LuCamera, onPress: onScan },
    { label: t("add.upload"), icon: LuFileImage, onPress: onUpload },
    { label: t("add.manual"), icon: LuKeyboard, onPress: onManual },
  ];

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
      <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {expanded &&
            actions.map(({ label, icon: Icon, onPress }, i) => (
              <motion.div
                key={label}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
                exit={{ opacity: 0, y: 12 }}
                initial={{ opacity: 0, y: 12 }}
                transition={{ delay: (actions.length - 1 - i) * 0.03 }}
              >
                <span className="rounded-full bg-content1 px-4 py-1.5 text-sm font-semibold shadow-medium">
                  {label}
                </span>
                <Button
                  isIconOnly
                  aria-label={label}
                  className="h-12 w-12"
                  radius="full"
                  variant="shadow"
                  onPress={() => {
                    setExpanded(false);
                    onPress();
                  }}
                >
                  <Icon className="text-xl" />
                </Button>
              </motion.div>
            ))}
        </AnimatePresence>
        <Button
          isIconOnly
          aria-expanded={expanded}
          aria-label={t("add.button")}
          className="h-14 w-14"
          color="secondary"
          radius="full"
          variant="shadow"
          onPress={() => setExpanded((v) => !v)}
        >
          <FaPlus
            className={`text-xl transition-transform ${expanded ? "rotate-45" : ""}`}
          />
        </Button>
      </div>
    </>
  );
}
