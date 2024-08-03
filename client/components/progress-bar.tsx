import React, { useEffect, useState } from "react";
import { Progress } from "@nextui-org/react";

interface ProgressProps {
  period: number;
  updateInterval: number;
}

const OTPProgress: React.FC<ProgressProps> = ({ period, updateInterval }) => {
  const [remainingTime, setRemainingTime] = useState(
    period - (Math.floor(Date.now() / 1000) % period)
  );

  useEffect(() => {
    const updateRemainingTime = () => {
      const seconds = period - (Math.floor(Date.now() / 1000) % period);
      setRemainingTime(seconds);
    };

    const interval = setInterval(() => {
      updateRemainingTime();
    }, updateInterval);

    return () => {
      clearInterval(interval);
    };
  }, [period, updateInterval]);

  const progressValue = (remainingTime / period) * 100;

  return (
    <Progress
      aria-label="Time remaining"
      size="sm"
      value={progressValue}
      color="success"
      showValueLabel={false}
      className="w-20"
    />
  );
};

export default OTPProgress;
