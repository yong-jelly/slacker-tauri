import { useState, useEffect, useRef } from "react";

interface UseBorderFlashOptions {
  /** 진행 중 여부 - true일 때만 이펙트 발생 */
  isActive: boolean;
  /** 초기 딜레이 범위 (ms) - [min, max] */
  initialDelayRange?: [number, number];
  /** 이펙트 지속 시간 (ms) */
  effectDuration?: number;
  /** 이펙트 간격 범위 (ms) - [min, max] */
  intervalRange?: [number, number];
}

interface UseBorderFlashReturn {
  /** 이펙트 표시 여부 */
  showBorderFlash: boolean;
}

/**
 * 랜덤 간격으로 외곽 라인 플래시 이펙트를 발생시키는 훅
 */
export const useBorderFlash = ({
  isActive,
  initialDelayRange = [2000, 5000],
  effectDuration = 3000,
  intervalRange = [8000, 15000],
}: UseBorderFlashOptions): UseBorderFlashReturn => {
  const [showBorderFlash, setShowBorderFlash] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive) {
      setShowBorderFlash(false);
      return;
    }

    const triggerFlash = () => {
      setShowBorderFlash(true);
      setTimeout(() => setShowBorderFlash(false), effectDuration);
    };

    // 초기 랜덤 딜레이 후 첫 이펙트
    const [minInitial, maxInitial] = initialDelayRange;
    const initialDelay = minInitial + Math.random() * (maxInitial - minInitial);
    const initialTimer = setTimeout(() => {
      triggerFlash();
    }, initialDelay);

    // 이후 랜덤 간격으로 반복
    const scheduleNextFlash = (): ReturnType<typeof setTimeout> => {
      const [minInterval, maxInterval] = intervalRange;
      const nextDelay = minInterval + Math.random() * (maxInterval - minInterval);
      return setTimeout(() => {
        triggerFlash();
        intervalRef.current = scheduleNextFlash();
      }, nextDelay);
    };

    intervalRef.current = scheduleNextFlash();

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isActive, initialDelayRange, effectDuration, intervalRange]);

  return { showBorderFlash };
};

