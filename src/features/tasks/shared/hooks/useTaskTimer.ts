import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { TaskStatus, TimeExtensionHistory } from "@entities/task";
import { getUrgencyLevel, getUrgencyColors, type UrgencyLevel, type UrgencyColors } from "../lib/urgency";
import { startTrayTimer, stopTrayTimer, getRemainingTime, syncTrayTimer } from "@shared/lib/tray";
import { sendTimerEndedNotification } from "@shared/lib/notification";
import type { StatusChangeOptions } from "../types";

export interface UseTaskTimerProps {
  expectedDuration: number;
  defaultDuration?: number;
  /** 저장된 남은 시간 (초 단위) - 일시정지 후 재시작 시 사용 */
  savedRemainingTimeSeconds?: number;
  isInProgress: boolean;
  taskTitle?: string;
  /** 상태 변경 핸들러 - 일시정지 시 남은 시간도 함께 전달 */
  onStatusChange?: (status: TaskStatus, options?: StatusChangeOptions) => void;
  onExtendTime?: (extension: TimeExtensionHistory) => void;
  onTimerEnd?: () => void;
}

interface UseTaskTimerReturn {
  /** 남은 시간 (밀리초 단위) */
  remainingTimeMs: number;
  /** 남은 시간 (초 단위) */
  remainingTimeSeconds: number;
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
  savedRemainingTimeSeconds,
  isInProgress,
  taskTitle,
  onStatusChange,
  onExtendTime,
  onTimerEnd,
}: UseTaskTimerProps): UseTaskTimerReturn => {
  const expectedDurationMs = expectedDuration * 60 * 1000;
  const timerDurationMs = defaultDuration ? defaultDuration * 1000 : expectedDurationMs;
  
  // 저장된 남은 시간이 유효하면 사용 (0보다 크고 null/undefined가 아닐 때)
  // 그렇지 않으면 전체 시간으로 초기화
  const getInitialRemainingMs = () => {
    if (savedRemainingTimeSeconds != null && savedRemainingTimeSeconds > 0) {
      return savedRemainingTimeSeconds * 1000;
    }
    return timerDurationMs;
  };

  const [remainingTimeMs, setRemainingTimeMs] = useState(getInitialRemainingMs);
  const [isRunning, setIsRunning] = useState(isInProgress);
  const timerEndedRef = useRef(false);
  const timerStartTimeRef = useRef<number | null>(null);
  const timerStartRemainingMsRef = useRef<number>(0);
  const lastSavedRemainingTimeSecondsRef = useRef<number | undefined>(savedRemainingTimeSeconds);
  // 일시정지 시 계산된 남은 시간 (handlePause에서 설정, handlePlay에서 사용)
  // useEffect에서 덮어쓰지 않도록 별도 ref로 관리
  const pausedRemainingMsRef = useRef<number | null>(null);
  
  // expectedDuration 변경 시 타이머 시간 조정 (pausedRemainingMsRef 보호)
  useEffect(() => {
    if (!isRunning && pausedRemainingMsRef.current === null) {
      const newTimerDurationMs = defaultDuration ? defaultDuration * 1000 : expectedDuration * 60 * 1000;
      if (savedRemainingTimeSeconds != null && savedRemainingTimeSeconds > 0) {
        setRemainingTimeMs(savedRemainingTimeSeconds * 1000);
      } else {
        setRemainingTimeMs(newTimerDurationMs);
      }
    }
  }, [expectedDuration, defaultDuration, savedRemainingTimeSeconds, isRunning]);

  // DB에서 로드된 savedRemainingTimeSeconds 변경 시 상태 동기화
  useEffect(() => {
    if (lastSavedRemainingTimeSecondsRef.current === savedRemainingTimeSeconds) {
      return;
    }
    lastSavedRemainingTimeSecondsRef.current = savedRemainingTimeSeconds;
    
    if (!isRunning) {
      // pausedRemainingMsRef가 있으면 덮어쓰지 않음 (handlePause에서 방금 설정한 값 보호)
      if (pausedRemainingMsRef.current !== null) {
        return;
      }
      
      if (savedRemainingTimeSeconds != null && savedRemainingTimeSeconds > 0) {
        const savedMs = savedRemainingTimeSeconds * 1000;
        setRemainingTimeMs((currentMs) => {
          const currentSecs = Math.floor(currentMs / 1000);
          // 차이가 2초 이상이면 저장된 값으로 동기화 (handlePause에서 방금 설정한 값은 유지)
          if (Math.abs(currentSecs - savedRemainingTimeSeconds) > 2) {
            return savedMs;
          }
          return currentMs;
        });
      } else {
        setRemainingTimeMs((currentMs) => {
          const newTimerDurationMs = defaultDuration ? defaultDuration * 1000 : expectedDuration * 60 * 1000;
          if (currentMs <= 0 || currentMs > newTimerDurationMs) {
            return newTimerDurationMs;
          }
          return currentMs;
        });
      }
    } else {
      // 실행 중일 때는 Rust 트레이 타이머와 동기화
      const syncWithRustTimer = async () => {
        try {
          const [remainingSecs, running] = await getRemainingTime();
          if (running) {
            setRemainingTimeMs(remainingSecs * 1000);
          } else {
            setIsRunning(false);
            setRemainingTimeMs(Math.max(0, remainingSecs * 1000));
          }
        } catch (error) {
          console.error("[useTaskTimer] Failed to sync with Rust timer:", error);
        }
      };
      syncWithRustTimer();
    }
  }, [savedRemainingTimeSeconds, isRunning, expectedDuration, defaultDuration]);

  const remainingTimeSeconds = Math.ceil(remainingTimeMs / 1000);

  // timerDurationMs를 동적으로 계산 (expectedDuration 변경 시 반영)
  const currentTimerDurationMs = useMemo(() => {
    return defaultDuration ? defaultDuration * 1000 : expectedDuration * 60 * 1000;
  }, [expectedDuration, defaultDuration]);

  const progress = useMemo(
    () => remainingTimeMs / currentTimerDurationMs,
    [remainingTimeMs, currentTimerDurationMs]
  );

  const completedProgress = useMemo(() => 1 - progress, [progress]);
  const urgencyLevel = useMemo(() => getUrgencyLevel(progress), [progress]);
  const urgencyColors = useMemo(() => getUrgencyColors(urgencyLevel), [urgencyLevel]);

  // Rust 타이머 종료 이벤트 수신
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    
    const setupListener = async () => {
      try {
        const unlisten = await listen("timer-ended", () => {
          if (taskTitle) {
            sendTimerEndedNotification(taskTitle);
          }
          onTimerEnd?.();
          setRemainingTimeMs(0);
          setIsRunning(false);
        });
        unlistenFn = unlisten;
      } catch (error) {
        console.error("[useTaskTimer] Failed to setup timer-ended listener:", error);
      }
    };

    setupListener();
    
    return () => {
      if (unlistenFn) {
        try {
          unlistenFn();
        } catch (error) {
          console.error("[useTaskTimer] Failed to cleanup timer-ended listener:", error);
        }
      }
    };
  }, [taskTitle, onTimerEnd]);

  // 창이 포그라운드로 돌아올 때 Rust 타이머와 동기화
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isRunning) {
        const [remainingSecs, running] = await getRemainingTime();
        if (running) {
          setRemainingTimeMs(remainingSecs * 1000);
        } else {
          // Rust 타이머가 멈춰있으면 (0이 되었을 수 있음)
          setIsRunning(false);
          setRemainingTimeMs(remainingSecs * 1000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning]);

  // 타이머 종료 처리
  useEffect(() => {
    if (remainingTimeMs === 0 && isRunning && !timerEndedRef.current) {
      timerEndedRef.current = true;
      setIsRunning(false);
      stopTrayTimer();
    }
    if (remainingTimeMs > 0) {
      timerEndedRef.current = false;
    }
  }, [remainingTimeMs, isRunning]);

  // 실행 중일 때 센티초 단위 UI 업데이트 및 Rust 타이머 동기화
  useEffect(() => {
    if (!isRunning || remainingTimeMs <= 0) {
      timerStartTimeRef.current = null;
      return;
    }

    if (timerStartTimeRef.current === null) {
      timerStartTimeRef.current = Date.now();
      timerStartRemainingMsRef.current = remainingTimeMs;
    }

    // 센티초 단위 업데이트 (10ms마다)
    const localTimer = setInterval(() => {
      if (timerStartTimeRef.current === null) return;
      
      const elapsedMs = Date.now() - timerStartTimeRef.current;
      const newRemainingMs = Math.max(0, timerStartRemainingMsRef.current - elapsedMs);
      
      setRemainingTimeMs(newRemainingMs);
      
      if (newRemainingMs === 0) {
        timerStartTimeRef.current = null;
        setIsRunning(false);
        stopTrayTimer();
        onTimerEnd?.();
      }
    }, 10);

    // Rust 트레이 타이머와 초 단위 동기화 (1초마다)
    const syncInterval = setInterval(async () => {
      try {
        const [remainingSecs, running] = await getRemainingTime();
        if (running) {
          const currentSecs = Math.floor(remainingTimeMs / 1000);
          if (Math.abs(currentSecs - remainingSecs) > 0) {
            timerStartTimeRef.current = Date.now();
            timerStartRemainingMsRef.current = remainingSecs * 1000;
            setRemainingTimeMs(remainingSecs * 1000);
          }
        } else {
          timerStartTimeRef.current = null;
          setIsRunning(false);
          setRemainingTimeMs(Math.max(0, remainingSecs * 1000));
        }
      } catch (error) {
        console.error("[useTaskTimer] Failed to sync with Rust timer:", error);
      }
    }, 1000);

    return () => {
      clearInterval(localTimer);
      clearInterval(syncInterval);
    };
  }, [isRunning, remainingTimeMs, onTimerEnd]);

  // isInProgress가 변경될 때 Rust 트레이 타이머와 동기화
  useEffect(() => {
    setIsRunning(isInProgress);
    
    // 실행 중으로 변경될 때 Rust 트레이 타이머와 동기화
    if (isInProgress) {
      const syncWithRustTimer = async () => {
        const [remainingSecs, running] = await getRemainingTime();
        if (running) {
          // Rust 타이머가 실행 중이면 그 시간으로 동기화
          const remainingMs = remainingSecs * 1000;
          timerStartTimeRef.current = Date.now();
          timerStartRemainingMsRef.current = remainingMs;
          setRemainingTimeMs(remainingMs);
        } else if (remainingSecs > 0) {
          // Rust 타이머가 멈춰있지만 남은 시간이 있으면 그 시간 사용
          const remainingMs = remainingSecs * 1000;
          timerStartTimeRef.current = null;
          timerStartRemainingMsRef.current = remainingMs;
          setRemainingTimeMs(remainingMs);
        }
      };
      syncWithRustTimer();
    } else {
      // 실행 중이 아니면 타이머 시작 시간 리셋
      timerStartTimeRef.current = null;
    }
  }, [isInProgress]);

  const handlePlay = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      
      const currentTimerDurationMs = defaultDuration ? defaultDuration * 1000 : expectedDuration * 60 * 1000;
      
      // 재시작 시 남은 시간 우선순위: DB 저장값 > pausedRemainingMsRef > 상태값 > 전체시간
      const pausedMs = pausedRemainingMsRef.current;
      const savedMs = savedRemainingTimeSeconds != null && savedRemainingTimeSeconds > 0 
        ? savedRemainingTimeSeconds * 1000 
        : null;
      
      let newRemainingMs: number;
      
      if (savedMs !== null && savedMs > 0 && savedMs <= currentTimerDurationMs) {
        newRemainingMs = savedMs;
      } else if (pausedMs !== null && pausedMs > 0 && pausedMs <= currentTimerDurationMs) {
        newRemainingMs = pausedMs;
        pausedRemainingMsRef.current = null;
      } else if (remainingTimeMs > 0 && remainingTimeMs <= currentTimerDurationMs) {
        newRemainingMs = remainingTimeMs;
      } else {
        newRemainingMs = currentTimerDurationMs;
      }
      
      timerStartTimeRef.current = Date.now();
      timerStartRemainingMsRef.current = newRemainingMs;
      
      setIsRunning(true);
      const remainingSecs = Math.ceil(newRemainingMs / 1000);
      await startTrayTimer(remainingSecs, taskTitle || "");
      setRemainingTimeMs(newRemainingMs);
      onStatusChange?.(TaskStatus.IN_PROGRESS);
    },
    [onStatusChange, remainingTimeMs, savedRemainingTimeSeconds, expectedDuration, defaultDuration, taskTitle]
  );

  const handlePause = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(false);
      
      // 로컬 타이머 기준 남은 시간 계산
      let localRemainingMs = remainingTimeMs;
      if (timerStartRemainingMsRef.current > 0 && timerStartTimeRef.current !== null) {
        const elapsedMs = Date.now() - timerStartTimeRef.current;
        const calculatedMs = Math.max(0, timerStartRemainingMsRef.current - elapsedMs);
        localRemainingMs = Math.min(localRemainingMs, calculatedMs);
      }
      
      timerStartTimeRef.current = null;
      
      // Rust 타이머 정지 및 남은 시간 조회
      const remainingSecs = await stopTrayTimer();
      const rustRemainingMs = remainingSecs * 1000;
      
      // 로컬 타이머와 Rust 타이머 중 더 정확한 값 사용 (더 작은 값 = 더 많이 경과된 값)
      const finalMs = Math.min(localRemainingMs, rustRemainingMs);
      
      setRemainingTimeMs(finalMs);
      timerStartRemainingMsRef.current = finalMs;
      pausedRemainingMsRef.current = finalMs;
      
      const finalRemainingSecs = Math.ceil(finalMs / 1000);
      onStatusChange?.(TaskStatus.PAUSED, { remainingTimeSeconds: finalRemainingSecs });
    },
    [onStatusChange, remainingTimeMs]
  );

  const handleQuickExtendTime = useCallback(
    async (e: React.MouseEvent, minutes: number) => {
      e.stopPropagation();
      const extension: TimeExtensionHistory = {
        id: crypto.randomUUID(),
        addedMinutes: minutes,
        previousDuration: expectedDuration,
        newDuration: expectedDuration + minutes,
        createdAt: new Date(),
      };
      onExtendTime?.(extension);
      
      const extendMs = minutes * 60 * 1000;
      const newRemainingMs = remainingTimeMs + extendMs;
      setRemainingTimeMs(newRemainingMs);
      
      // Rust 트레이 타이머 동기화
      if (isRunning) {
        await syncTrayTimer(Math.ceil(newRemainingMs / 1000));
      }
    },
    [expectedDuration, onExtendTime, isRunning, remainingTimeMs]
  );

  const extendRemainingTime = useCallback(async (minutes: number) => {
    const extendMs = minutes * 60 * 1000;
    const newRemainingMs = remainingTimeMs + extendMs;
    setRemainingTimeMs(newRemainingMs);
    
    if (isRunning) {
      await syncTrayTimer(Math.ceil(newRemainingMs / 1000));
    }
  }, [isRunning, remainingTimeMs]);

  return {
    remainingTimeMs,
    remainingTimeSeconds,
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
