import { memo, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CircularProgress,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { MdDelete, MdEdit, MdMoreVert, MdQrCode } from "react-icons/md";

import { getServiceIconUrl } from "../lib/simple-icons";
import { formatCode, generateCode, secondsRemaining } from "../lib/totp";
import { toast } from "../lib/toast";
import { Entry } from "../lib/vault/types";

export type EntryAction = "qr" | "edit" | "delete";

/** "Amazon Web Services" -> "AW", "Discord" -> "D". */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

interface OtpCardProps {
  entry: Entry;
  now: number;
  onAction: (action: EntryAction, entry: Entry) => void;
}

export const OtpCard = memo(function OtpCard({
  entry,
  now,
  onAction,
}: OtpCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const step = Math.floor(now / 1000 / entry.period);
  const code = useMemo(() => generateCode(entry, now), [entry, step]);
  const nextCode = useMemo(
    () => generateCode(entry, (step + 1) * entry.period * 1000),
    [entry, step],
  );
  const remaining = secondsRemaining(entry.period, now);
  const expiring = remaining <= 5;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t("home.copied"));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("home.copyFailed"));
    }
  };

  return (
    <Card
      className="noselect cursor-pointer transition-[transform,box-shadow] active:scale-[0.98] betterhover:hover:shadow-medium"
      shadow="sm"
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      <div
        className="flex flex-col gap-3 p-4 outline-none focus-visible:ring-2 focus-visible:ring-focus"
        role="button"
        tabIndex={0}
        onClick={copy}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void copy();
          }
        }}
      >
        <div className="flex items-center gap-3">
          <Avatar
            showFallback
            // Service icons are full circles already: once one loads it fills
            // the avatar, and only the initials fallback gets a background.
            className="h-11 w-11 flex-shrink-0 bg-default-100 has-[img[data-loaded=true]]:bg-transparent"
            classNames={{ img: "object-cover" }}
            getInitials={initials}
            name={entry.issuer}
            radius="lg"
            src={getServiceIconUrl(entry.issuer)}
          />
          <div className="min-w-0 flex-grow">
            <p className="truncate text-lg font-semibold">{entry.issuer}</p>
            {entry.label && (
              <p className="truncate text-sm text-default-500">{entry.label}</p>
            )}
          </div>
          <Dropdown
            isOpen={menuOpen}
            placement="bottom-end"
            onOpenChange={setMenuOpen}
          >
            <DropdownTrigger>
              <Button
                isIconOnly
                aria-label={t("menu.actions")}
                className="-mr-2 -mt-1 flex-shrink-0"
                radius="full"
                size="sm"
                variant="light"
                onClick={(e) => e.stopPropagation()}
              >
                <MdMoreVert className="text-xl text-default-500" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label={t("menu.actions")}
              onAction={(key) => onAction(key as EntryAction, entry)}
            >
              <DropdownItem
                key="qr"
                startContent={<MdQrCode className="text-lg" />}
              >
                {t("menu.showQr")}
              </DropdownItem>
              <DropdownItem
                key="edit"
                startContent={<MdEdit className="text-lg" />}
              >
                {t("menu.edit")}
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<MdDelete className="text-lg" />}
              >
                {t("menu.delete")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p
              aria-live="polite"
              className={`font-code ${entry.digits > 6 ? "text-[2rem]" : "text-[2.5rem]"} whitespace-nowrap font-semibold leading-tight tabular-nums tracking-[0.04em] [word-spacing:0.12em] transition-colors ${
                copied
                  ? "text-success"
                  : expiring
                    ? "text-warning"
                    : "text-foreground"
              }`}
            >
              {formatCode(code)}
            </p>
            <p
              className={`text-xs text-default-500 transition-opacity ${
                expiring ? "opacity-100" : "opacity-0"
              }`}
            >
              {t("home.next")}:{" "}
              <span className="font-code font-medium tabular-nums">
                {formatCode(nextCode)}
              </span>
            </p>
          </div>
          <CircularProgress
            showValueLabel
            aria-label={`${remaining}s`}
            classNames={{
              svg: "w-12 h-12",
              track: "stroke-default-200",
              value: "font-code text-sm font-semibold tabular-nums",
            }}
            color={expiring ? "warning" : "success"}
            disableAnimation={remaining === entry.period}
            strokeWidth={3}
            value={(remaining / entry.period) * 100}
            valueLabel={remaining}
          />
        </div>
      </div>
    </Card>
  );
});
