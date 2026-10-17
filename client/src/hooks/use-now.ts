import { useEffect, useState } from "react";

/** Current time, re-rendering on every wall-clock second. */
export function useNow(): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    let timer: number;

    const tick = () => {
      setNow(Date.now());
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };

    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));

    return () => window.clearTimeout(timer);
  }, []);

  return now;
}
