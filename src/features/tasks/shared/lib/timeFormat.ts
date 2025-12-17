/**
 * 시간 관련 포맷팅 유틸리티 함수들
 */

/** 초 단위를 M:SS 형식으로 변환 (0:00 ~ 59:59) */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/** 밀리초 단위를 MM:SS.cc 형식으로 변환 (100분의 1초 포함) */
export const formatTimeMs = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
};

/** 분 단위를 한글 형식으로 변환 (예: 5분, 1시간 30분) */
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
};

/**
 * 초 단위를 사람이 읽기 쉬운 한글 형식으로 변환
 * - 0초 → 1초
 * - 60초 미만 → N초
 * - 60초 이상 1시간 미만 → N분M초 (0초면 N분)
 * - 1시간 이상 → N시간M분 (0분이면 N시간, 초는 표시 안함)
 */
export const formatSecondsReadable = (totalSeconds: number): string => {
  // 0초 이하면 1초로 표시
  if (totalSeconds <= 0) return "1초";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // 1시간 이상
  if (hours > 0) {
    return minutes > 0 ? `${hours}시간${minutes}분` : `${hours}시간`;
  }
  
  // 1분 이상 1시간 미만
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}분${seconds}초` : `${minutes}분`;
  }
  
  // 1분 미만
  return `${seconds}초`;
};

/**
 * 소비된 시간과 전체 시간을 "소비시간/전체시간" 형식으로 표시
 * - 소비된 시간이 0이면 전체 시간만 표시
 * - 전체 시간은 분 단위(expectedDuration), 남은 시간은 초 단위(remainingTimeSeconds)
 */
export const formatDurationWithSpent = (
  expectedDurationMinutes: number,
  remainingTimeSeconds: number | null | undefined
): string => {
  const totalSeconds = expectedDurationMinutes * 60;
  const totalTimeText = formatSecondsReadable(totalSeconds);
  
  // 남은 시간이 없으면 전체 시간만 표시
  if (remainingTimeSeconds === null || remainingTimeSeconds === undefined) {
    return totalTimeText;
  }
  
  // 소비된 시간 계산
  const spentSeconds = totalSeconds - remainingTimeSeconds;
  
  // 소비된 시간이 0 이하면 전체 시간만 표시
  if (spentSeconds <= 0) {
    return totalTimeText;
  }
  
  const spentTimeText = formatSecondsReadable(spentSeconds);
  return `${spentTimeText}/${totalTimeText}`;
};

/** 목표일을 상대적 텍스트로 변환 (오늘, 내일, n일 후 등) */
export const formatTargetDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff === -1) return "어제";
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  return `${diff}일 후`;
};

/** 상대 시간 포맷 (방금, n분 전, n시간 전, n일 전) */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return "어제";
  return `${days}일 전`;
};

/** 날짜를 한글 형식으로 변환 (M월 D일 HH:MM) */
export const formatDateTime = (date: Date): string => {
  return date.toLocaleDateString("ko-KR", { 
    month: "short", 
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** 목표일 지연 일수 계산 (양수: 지연됨, 0 이하: 지연 아님) */
export const getDelayDays = (targetDate: Date): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
};

