import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Kbd } from "@heroui/react";
import { useTranslation } from "react-i18next";
import {
  LuCamera,
  LuFileImage,
  LuKeyboard,
  LuSearch,
  LuSearchX,
  LuX,
} from "react-icons/lu";
import { MdShield } from "react-icons/md";

import { ConfirmModal } from "../components/confirm-modal";
import { EntryModal } from "../components/entry-modal";
import { FAB } from "../components/fab";
import { EntryAction, OtpCard } from "../components/otp-card";
import { PasskeyNudge } from "../components/passkey-nudge";
import { QrModal } from "../components/qr-modal";
import { QrScannerModal } from "../components/qr-scanner";
import { QrUploaderModal } from "../components/qr-uploader";
import { useNow } from "../hooks/use-now";
import DefaultLayout from "../layouts/default";
import { searchEntries } from "../lib/search";
import { OtpauthParseError, parseOtpauthUri } from "../lib/totp";
import { toast } from "../lib/toast";
import { Entry, EntryInput } from "../lib/vault/types";
import { useVault } from "../providers/vault-provider";

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

type Dialog =
  | { type: "scan" }
  | { type: "upload" }
  | { type: "add"; initial?: EntryInput }
  | { type: "edit"; entry: Entry }
  | { type: "qr"; entry: Entry }
  | { type: "delete"; entry: Entry };

export default function HomePage() {
  const { t } = useTranslation();
  const { entries, deleteEntry } = useVault();
  const now = useNow();
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setDialog(null), []);

  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          a.issuer.localeCompare(b.issuer, undefined, {
            sensitivity: "base",
          }) ||
          a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
      ),
    [entries],
  );
  const visible = useMemo(() => searchEntries(sorted, query), [sorted, query]);

  // Ctrl/Cmd+K or "/" focuses search.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      if (
        ((e.metaKey || e.ctrlKey) && e.key === "k") ||
        (e.key === "/" && !typing)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // The fade under the search bar only shows once cards scroll under it, so
  // it doesn't cover the top of the first card.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScanned = useCallback(
    (text: string) => {
      if (text.startsWith("otpauth-migration://")) {
        toast.error(t("scan.migration"));
        close();

        return;
      }
      try {
        setDialog({ type: "add", initial: parseOtpauthUri(text) });
      } catch (error) {
        const code =
          error instanceof OtpauthParseError ? error.code : "not-otpauth";

        toast.error(
          code === "not-totp"
            ? t("scan.notTotp")
            : code === "not-otpauth"
              ? t("scan.notOtpauth")
              : t("scan.badSecret"),
        );
        close();
      }
    },
    [close, t],
  );

  const handleAction = useCallback((action: EntryAction, entry: Entry) => {
    setDialog({ type: action, entry });
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    searchRef.current?.focus();
  }, []);

  const openScan = useCallback(() => setDialog({ type: "scan" }), []);
  const openUpload = useCallback(() => setDialog({ type: "upload" }), []);
  const openManual = useCallback(() => setDialog({ type: "add" }), []);

  return (
    <DefaultLayout>
      {entries.length > 0 ? (
        <>
          {/*
           * Sticks under the navbar. ::before fills the strip behind the
           * translucent navbar so cards don't show through above the search,
           * and ::after fades cards out as they scroll under it.
           */}
          <div
            className="sticky top-16 z-30 -mx-4 -mt-4 mb-1 bg-background px-4 py-3 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-16 before:bg-background after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-background after:to-transparent after:opacity-0 after:transition-opacity data-[scrolled=true]:after:opacity-100 sm:-mx-6 sm:-mt-6 sm:mb-2 sm:px-6 sm:py-4"
            data-scrolled={scrolled}
          >
            <div className="flex items-center gap-4">
              <Input
                ref={searchRef}
                aria-label={t("home.search")}
                className="sm:max-w-md"
                classNames={{
                  inputWrapper:
                    "h-12 bg-default-100 px-4 shadow-none transition-[background-color,box-shadow] data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-content1 group-data-[focus=true]:shadow-[0_0_0_2px_hsl(var(--heroui-focus)),0_0_0_6px_hsl(var(--heroui-focus)/0.16)] group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:ring-offset-0",
                  input:
                    "text-base placeholder:text-default-500 [&::-webkit-search-cancel-button]:appearance-none",
                }}
                endContent={
                  query ? (
                    <Button
                      isIconOnly
                      aria-label={t("home.clearSearch")}
                      className="-mr-2 h-8 w-8 min-w-8 text-default-500"
                      radius="full"
                      size="sm"
                      variant="light"
                      onPress={clearSearch}
                    >
                      <LuX className="text-lg" />
                    </Button>
                  ) : (
                    <Kbd
                      className="pointer-events-none hidden flex-shrink-0 bg-content1 px-2 font-sans text-xs font-medium text-default-500 shadow-none ring-1 ring-divider sm:betterhover:inline-flex"
                      keys={isMac ? ["command"] : undefined}
                    >
                      {isMac ? "K" : "Ctrl K"}
                    </Kbd>
                  )
                }
                placeholder={t("home.search")}
                radius="full"
                startContent={
                  <LuSearch className="mr-1 flex-shrink-0 text-lg text-default-500" />
                }
                type="search"
                value={query}
                onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                onValueChange={setQuery}
              />
              <span className="ml-auto hidden flex-shrink-0 text-sm font-medium tabular-nums text-default-500 sm:block">
                {query
                  ? `${visible.length} / ${entries.length}`
                  : t("home.count", { count: entries.length })}
              </span>
            </div>
          </div>

          {!query && <PasskeyNudge className="mb-4" />}

          {visible.length === 0 ? (
            <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-default-100">
                <LuSearchX className="text-2xl text-default-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold">
                  {t("home.noResultsTitle")}
                </h2>
                <p className="break-words text-default-500">
                  {t("home.noResults", { query })}
                </p>
              </div>
              <Button radius="full" variant="flat" onPress={clearSearch}>
                {t("home.clearSearch")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {visible.map((entry) => (
                <OtpCard
                  key={entry.id}
                  entry={entry}
                  now={now}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}

          <FAB onManual={openManual} onScan={openScan} onUpload={openUpload} />
        </>
      ) : (
        <>
          <PasskeyNudge className="mx-auto max-w-lg" />
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-200 dark:bg-secondary-100">
              <MdShield className="text-4xl text-secondary-700" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{t("home.emptyTitle")}</h1>
              <p className="text-default-500">{t("home.emptyBody")}</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button
                color="primary"
                radius="full"
                size="lg"
                startContent={<LuCamera />}
                onPress={openScan}
              >
                {t("add.scan")}
              </Button>
              <Button
                radius="full"
                size="lg"
                startContent={<LuFileImage />}
                variant="flat"
                onPress={openUpload}
              >
                {t("add.upload")}
              </Button>
              <Button
                radius="full"
                size="lg"
                startContent={<LuKeyboard />}
                variant="light"
                onPress={openManual}
              >
                {t("add.manual")}
              </Button>
            </div>
          </div>
        </>
      )}

      <QrScannerModal
        isOpen={dialog?.type === "scan"}
        onClose={close}
        onResult={handleScanned}
      />
      <QrUploaderModal
        isOpen={dialog?.type === "upload"}
        onClose={close}
        onResult={handleScanned}
      />
      <EntryModal
        entry={dialog?.type === "edit" ? dialog.entry : undefined}
        initial={dialog?.type === "add" ? dialog.initial : undefined}
        isOpen={dialog?.type === "add" || dialog?.type === "edit"}
        onClose={close}
      />
      <QrModal
        entry={dialog?.type === "qr" ? dialog.entry : null}
        onClose={close}
      />
      <ConfirmModal
        body={t("menu.deleteBody")}
        confirmLabel={t("common.delete")}
        isOpen={dialog?.type === "delete"}
        title={t("menu.deleteTitle", {
          issuer: dialog?.type === "delete" ? dialog.entry.issuer : "",
        })}
        onClose={close}
        onConfirm={async () => {
          if (dialog?.type !== "delete") return;
          await deleteEntry(dialog.entry.id);
          toast.success(t("menu.deleted"));
        }}
      />
    </DefaultLayout>
  );
}
