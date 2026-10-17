export type AutoLock = "1" | "5" | "15" | "60" | "never";

const AUTO_LOCK_KEY = "2fair.autoLock";

export const AUTO_LOCK_OPTIONS: AutoLock[] = ["1", "5", "15", "60", "never"];

export function getAutoLock(): AutoLock {
  const value = localStorage.getItem(AUTO_LOCK_KEY) as AutoLock | null;

  return value && AUTO_LOCK_OPTIONS.includes(value) ? value : "5";
}

export function setAutoLock(value: AutoLock) {
  localStorage.setItem(AUTO_LOCK_KEY, value);
}
