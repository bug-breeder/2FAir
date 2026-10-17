import { DogMark } from "./icons";

/**
 * The 2FAir app icon. Size it with classes so it can grow with the viewport;
 * use `compact` where it renders under ~48px.
 */
export function Logo({
  className = "h-20 w-20 sm:h-24 sm:w-24",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <DogMark
      className={`flex-shrink-0 rounded-[22.6%] dark:ring-1 dark:ring-white/10 ${className}`}
      compact={compact}
    />
  );
}

/** Renders `text` with the "2FAir" wordmark on a lime highlighter band. */
export function Wordmark({ text }: { text: string }) {
  const [before, ...rest] = text.split("2FAir");

  if (rest.length === 0) return <>{text}</>;

  return (
    <>
      {before}
      <span className="mark-lime">2FAir</span>
      {rest.join("2FAir")}
    </>
  );
}
