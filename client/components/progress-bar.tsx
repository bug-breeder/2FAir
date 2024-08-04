import React, { useEffect, useState } from "react";
import { Progress } from "@nextui-org/react";

interface ProgressProps {
  period: number;
  updateInterval: number;
}

/**
 * OTPProgress Component
 *
 * This component displays a progress bar that updates based on a specified period and update interval.
 * It is designed to show the elapsed time as a percentage of the total period.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {number} props.period - The total period in seconds for the progress bar to complete.
 * @param {number} props.updateInterval - The interval in milliseconds at which the progress bar updates, should be not greater than 1000.
 *
 * @example
 * <OTPProgress period={30} updateInterval={1000} />
 *
 * @returns {JSX.Element} A progress bar component.
 */
const OTPProgress: React.FC<ProgressProps> = ({ period, updateInterval }) => {
  const [elapsedTime, setElapsedTime] = useState(
    (Math.floor(Date.now() / (1000 / updateInterval)) / 100) % period
  );

  useEffect(() => {
    const updateElapsedTime = () => {
      const seconds =
        (Math.floor(Date.now() / (1000 / updateInterval)) / 100) % period;

      setElapsedTime(seconds);
    };

    const interval = setInterval(() => {
      updateElapsedTime();
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [elapsedTime]);

  const progressValue = (elapsedTime / period) * 100;

  return (
    <Progress
      aria-label="Time elapsed"
      size="sm"
      value={progressValue}
      color="success"
      showValueLabel={false}
      className="w-20"
    />
  );
};

export default OTPProgress;
