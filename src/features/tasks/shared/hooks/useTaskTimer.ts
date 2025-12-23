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
  
  // expectedDuration이 변경되면 timerDurationMs도 업데이트하고, 필요시 remainingTimeMs도 조정
  useEffect(() => {
    const newExpectedDurationMs = expectedDuration * 60 * 1000;
    const newTimerDurationMs = defaultDuration ? defaultDuration * 1000 : newExpectedDurationMs;
    
    // 실행 중이 아니고, 저장된 남은 시간이 없거나 0이면 전체 시간으로 리셋
    if (!isRunning) {
      if (savedRemainingTimeSeconds != null && savedRemainingTimeSeconds > 0) {
        // 저장된 남은 시간이 있으면 그대로 사용
        setRemainingTimeMs(savedRemainingTimeSeconds * 1000);
      } else {
        // 저장된 남은 시간이 없으면 새로운 전체 시간으로 리셋
        setRemainingTimeMs(newTimerDurationMs);
      }
    }
  }, [expectedDuration, defaultDuration, savedRemainingTimeSeconds, isRunning]);

  // savedRemainingTimeSeconds가 변경되면 (DB에서 새로 로드된 경우) 상태 동기화
  // 실행 중이 아닐 때: DB 값으로 동기화
  // 실행 중일 때: Rust 트레이 타이머와 동기화 (단일 소스)
  useEffect(() => {
    console.log("[useTaskTimer] savedRemainingTimeSeconds:", savedRemainingTimeSeconds, "isRunning:", isRunning);
    if (!isRunning) {
      if (savedRemainingTimeSeconds != null && savedRemainingTimeSeconds > 0) {
        console.log("[useTaskTimer] Setting remainingTimeMs to:", savedRemainingTimeSeconds * 1000);
        setRemainingTimeMs(savedRemainingTimeSeconds * 1000);
      } else {
        // null이거나 0 이하일 때는 전체 시간으로 리셋
        const newTimerDurationMs = defaultDuration ? defaultDuration * 1000 : expectedDuration * 60 * 1000;
        console.log("[useTaskTimer] Resetting to timerDurationMs:", newTimerDurationMs);
        setRemainingTimeMs(newTimerDurationMs);
      }
    } else {
      // 실행 중일 때는 Rust 트레이 타이머와 동기화 (위젯 모드와 일반 모드 동기화를 위해)
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

  // 초 단위
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

  // 실행 중일 때 Rust 트레이 타이머와 주기적으로 동기화 (위젯 모드와 일반 모드 동기화를 위해)
  // Rust 타이머를 단일 소스로 사용하여 정확한 동기화 보장
  useEffect(() => {
    if (!isRunning || remainingTimeMs <= 0) return;

    // 100ms마다 Rust 트레이 타이머와 동기화 (부드러운 UI 업데이트와 정확성 모두 확보)
    const syncInterval = setInterval(async () => {
      try {
        const [remainingSecs, running] = await getRemainingTime();
        if (running) {
          // Rust 타이머가 실행 중이면 그 시간으로 동기화
          setRemainingTimeMs(remainingSecs * 1000);
        } else {
          // Rust 타이머가 멈춰있으면 상태 동기화
          setIsRunning(false);
          setRemainingTimeMs(Math.max(0, remainingSecs * 1000));
        }
      } catch (error) {
        console.error("[useTaskTimer] Failed to sync with Rust timer:", error);
        // 에러 발생 시 로컬 타이머로 폴백 (10ms 감소)
        setRemainingTimeMs((prev) => Math.max(0, prev - 10));
      }
    }, 100);

    return () => clearInterval(syncInterval);
  }, [isRunning, remainingTimeMs]);

  // isInProgress가 변경될 때 Rust 트레이 타이머와 동기화
  useEffect(() => {
    setIsRunning(isInProgress);
    
    // 실행 중으로 변경될 때 Rust 트레이 타이머와 동기화
    if (isInProgress) {
      const syncWithRustTimer = async () => {
        const [remainingSecs, running] = await getRemainingTime();
        if (running) {
          // Rust 타이머가 실행 중이면 그 시간으로 동기화
          setRemainingTimeMs(remainingSecs * 1000);
        } else if (remainingSecs > 0) {
          // Rust 타이머가 멈춰있지만 남은 시간이 있으면 그 시간 사용
          setRemainingTimeMs(remainingSecs * 1000);
        }
      };
      syncWithRustTimer();
    }
  }, [isInProgress]);

  const handlePlay = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      
      let newRemainingMs = remainingTimeMs;
      const currentTimerDurationMs = defaultDuration ? defaultDuration * 1000 : expectedDuration * 60 * 1000;
      console.log("[handlePlay] Current remainingTimeMs:", remainingTimeMs, "timerDurationMs:", currentTimerDurationMs);
      if (remainingTimeMs === 0) {
        newRemainingMs = currentTimerDurationMs;
        setRemainingTimeMs(currentTimerDurationMs);
        console.log("[handlePlay] Reset to timerDurationMs:", currentTimerDurationMs);
      }
      
      setIsRunning(true);
      // Rust 트레이 타이머 시작
      console.log("[handlePlay] Starting timer with:", Math.ceil(newRemainingMs / 1000), "seconds");
      await startTrayTimer(Math.ceil(newRemainingMs / 1000), taskTitle || "");
      onStatusChange?.(TaskStatus.IN_PROGRESS);
    },
    [onStatusChange, remainingTimeMs, expectedDuration, defaultDuration, taskTitle]
  );

  const handlePause = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(false);
      // Rust 트레이 타이머 정지하고 남은 시간 반환받기
      const remainingSecs = await stopTrayTimer();
      console.log("[handlePause] stopTrayTimer returned:", remainingSecs);
      // Rust 타이머에서 반환된 남은 시간으로 동기화
      setRemainingTimeMs(remainingSecs * 1000);
      // 상태 변경과 남은 시간을 함께 전달 (하나의 트랜잭션으로 저장)
      onStatusChange?.(TaskStatus.PAUSED, { remainingTimeSeconds: remainingSecs });
    },
    [onStatusChange]
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
