/**
 * Slows down passcode guessing through the UI. This does not protect against
 * someone who copies the browser profile; the passkey is the strong factor.
 */

const ATTEMPTS_KEY = "2fair.failedAttempts";
const UNTIL_KEY = "2fair.lockedUntil";
const FREE_ATTEMPTS = 5;
const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 15 * 60_000;

export function getLockedUntil(): number {
  return Number(localStorage.getItem(UNTIL_KEY) ?? 0);
}

export function recordFailedAttempt(): number {
  const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0) + 1;

  localStorage.setItem(ATTEMPTS_KEY, String(attempts));

  if (attempts >= FREE_ATTEMPTS) {
    const delay = Math.min(
      BASE_DELAY_MS * 2 ** (attempts - FREE_ATTEMPTS),
      MAX_DELAY_MS,
    );

    localStorage.setItem(UNTIL_KEY, String(Date.now() + delay));
  }

  return attempts;
}

export function resetFailedAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(UNTIL_KEY);
}
