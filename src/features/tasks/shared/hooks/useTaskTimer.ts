import { useState, useEffect, useCallback, useMemo } from "react";
import { TaskStatus, TimeExtensionHistory } from "@entities/task";
import { getUrgencyLevel, getUrgencyColors, type UrgencyLevel, type UrgencyColors } from "../lib/urgency";

interface UseTaskTimerProps {
  expectedDuration: number;
  defaultDuration?: number;
  isInProgress: boolean;
  onStatusChange?: (status: TaskStatus) => void;
  onExtendTime?: (extension: TimeExtensionHistory) => void;
}

interface UseTaskTimerReturn {
  remainingTime: number;
  isRunning: boolean;
  progress: number;
  completedProgress: number;
  urgencyLevel: UrgencyLevel;
  urgencyColors: UrgencyColors;
  handlePlay: (e: React.MouseEvent) => void;
  handlePause: (e: React.MouseEvent) => void;
  handleQuickExtendTime: (e: React.MouseEvent, minutes: number) => void;
  extendRemainingTime: (minutes: number) => void;
}

export const useTaskTimer = ({
  expectedDuration,
  defaultDuration,
  isInProgress,
  onStatusChange,
  onExtendTime,
}: UseTaskTimerProps): UseTaskTimerReturn => {
  const expectedDurationSeconds = expectedDuration * 60;
  const timerDuration = defaultDuration ?? expectedDurationSeconds;

  const [remainingTime, setRemainingTime] = useState(timerDuration);
  const [isRunning, setIsRunning] = useState(isInProgress);

  const progress = useMemo(
    () => remainingTime / timerDuration,
    [remainingTime, timerDuration]
  );

  const completedProgress = useMemo(() => 1 - progress, [progress]);

  const urgencyLevel = useMemo(() => getUrgencyLevel(progress), [progress]);
  const urgencyColors = useMemo(() => getUrgencyColors(urgencyLevel), [urgencyLevel]);

  useEffect(() => {
    if (!isRunning || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remainingTime]);

  useEffect(() => {
    setIsRunning(isInProgress);
  }, [isInProgress]);

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(true);
      if (remainingTime === 0) {
        setRemainingTime(timerDuration);
      }
      onStatusChange?.(TaskStatus.IN_PROGRESS);
    },
    [onStatusChange, remainingTime, timerDuration]
  );

  const handlePause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(false);
      onStatusChange?.(TaskStatus.PAUSED);
    },
    [onStatusChange]
  );

  const handleQuickExtendTime = useCallback(
    (e: React.MouseEvent, minutes: number) => {
      e.stopPropagation();
      const extension: TimeExtensionHistory = {
        id: crypto.randomUUID(),
        addedMinutes: minutes,
        previousDuration: expectedDuration,
        newDuration: expectedDuration + minutes,
        createdAt: new Date(),
      };
      onExtendTime?.(extension);
      setRemainingTime((prev) => prev + minutes * 60);
    },
    [expectedDuration, onExtendTime]
  );

  const extendRemainingTime = useCallback((minutes: number) => {
    setRemainingTime((prev) => prev + minutes * 60);
  }, []);

  return {
    remainingTime,
    isRunning,
    progress,
    completedProgress,
    urgencyLevel,
    urgencyColors,
    handlePlay,
    handlePause,
    handleQuickExtendTime,
    extendRemainingTime,
  };
};

