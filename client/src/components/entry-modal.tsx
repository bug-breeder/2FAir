import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionItem,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

import { ALGORITHMS, isValidSecret, normalizeSecret } from "../lib/totp";
import { toast } from "../lib/toast";
import { isSameAccount } from "../lib/vault/backup";
import { Algorithm, Entry, EntryInput } from "../lib/vault/types";
import { useVault } from "../providers/vault-provider";

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Edit this entry. */
  entry?: Entry;
  /** Prefill a new entry (e.g. from a scanned QR code). */
  initial?: EntryInput;
}

interface FormState {
  issuer: string;
  label: string;
  secret: string;
  algorithm: Algorithm;
  digits: string;
  period: string;
}

const blank: FormState = {
  issuer: "",
  label: "",
  secret: "",
  algorithm: "SHA1",
  digits: "6",
  period: "30",
};

function toForm(source?: EntryInput): FormState {
  if (!source) return blank;

  return {
    issuer: source.issuer,
    label: source.label,
    secret: source.secret,
    algorithm: source.algorithm,
    digits: String(source.digits),
    period: String(source.period),
  };
}

export function EntryModal({
  isOpen,
  onClose,
  entry,
  initial,
}: EntryModalProps) {
  const { t } = useTranslation();
  const { entries, addEntry, updateEntry } = useVault();
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!entry;
  const isAdvancedCustom =
    form.algorithm !== "SHA1" || form.digits !== "6" || form.period !== "30";

  useEffect(() => {
    if (isOpen) {
      setForm(toForm(entry ?? initial));
      setErrors({});
      setShowSecret(false);
    }
  }, [isOpen, entry, initial]);

  const set = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): EntryInput | null => {
    const next: typeof errors = {};
    const period = Number(form.period);

    if (!form.issuer.trim()) next.issuer = t("entry.issuerRequired");
    if (!form.secret.trim()) next.secret = t("entry.secretRequired");
    else if (!isValidSecret(form.secret))
      next.secret = t("entry.secretInvalid");
    if (!Number.isInteger(period) || period < 10 || period > 300) {
      next.period = t("entry.periodInvalid");
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return {
      issuer: form.issuer.trim(),
      label: form.label.trim(),
      secret: normalizeSecret(form.secret),
      algorithm: form.algorithm,
      digits: Number(form.digits),
      period,
    };
  };

  const handleSubmit = async () => {
    const input = validate();

    if (!input) return;

    const duplicate = entries.some(
      (e) => e.id !== entry?.id && isSameAccount(e, input),
    );

    if (duplicate) {
      toast.warning(t("entry.duplicate"));

      return;
    }

    setSaving(true);
    try {
      if (entry) {
        await updateEntry(entry.id, input);
        toast.success(t("entry.updated"));
      } else {
        await addEntry(input);
        toast.success(t("entry.added", { issuer: input.issuer }));
      }
      onClose();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <ModalHeader>
            {isEdit ? t("entry.editTitle") : t("entry.addTitle")}
          </ModalHeader>
          <ModalBody>
            <Input
              errorMessage={errors.issuer}
              isInvalid={!!errors.issuer}
              label={t("entry.issuer")}
              placeholder={t("entry.issuerPlaceholder")}
              value={form.issuer}
              onValueChange={set("issuer")}
            />
            <Input
              label={t("entry.label")}
              placeholder={t("entry.labelPlaceholder")}
              value={form.label}
              onValueChange={set("label")}
            />
            <Input
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              classNames={{ input: "font-mono" }}
              endContent={
                <button
                  aria-label={showSecret ? "Hide" : "Show"}
                  className="text-xl text-default-400"
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                >
                  {showSecret ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              }
              errorMessage={errors.secret}
              isInvalid={!!errors.secret}
              label={t("entry.secret")}
              placeholder={t("entry.secretPlaceholder")}
              spellCheck="false"
              type={showSecret ? "text" : "password"}
              value={form.secret}
              onValueChange={set("secret")}
            />
            <Accordion
              className="px-0"
              defaultExpandedKeys={isAdvancedCustom ? ["advanced"] : []}
              itemClasses={{
                title: "text-sm text-default-500",
                trigger: "py-2",
              }}
            >
              <AccordionItem
                key="advanced"
                aria-label={t("entry.advanced")}
                title={t("entry.advanced")}
              >
                <div className="grid grid-cols-3 gap-2 pb-2">
                  <Select
                    disallowEmptySelection
                    label={t("entry.algorithm")}
                    selectedKeys={[form.algorithm]}
                    size="sm"
                    onSelectionChange={(keys) =>
                      set("algorithm")(String(Array.from(keys)[0]))
                    }
                  >
                    {ALGORITHMS.map((a) => (
                      <SelectItem key={a}>{a}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    disallowEmptySelection
                    label={t("entry.digits")}
                    selectedKeys={[form.digits]}
                    size="sm"
                    onSelectionChange={(keys) =>
                      set("digits")(String(Array.from(keys)[0]))
                    }
                  >
                    {["6", "7", "8"].map((d) => (
                      <SelectItem key={d}>{d}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    endContent={
                      <span className="pointer-events-none text-small text-default-500">
                        {t("entry.seconds")}
                      </span>
                    }
                    errorMessage={errors.period}
                    inputMode="numeric"
                    isInvalid={!!errors.period}
                    label={t("entry.period")}
                    size="sm"
                    type="number"
                    value={form.period}
                    onValueChange={set("period")}
                  />
                </div>
              </AccordionItem>
            </Accordion>
          </ModalBody>
          <ModalFooter>
            <Button radius="full" variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              isLoading={saving}
              radius="full"
              type="submit"
            >
              {isEdit ? t("common.save") : t("add.button")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
