/**
 * 시간 관련 포맷팅 유틸리티 함수들
 */

/** 초 단위를 MM:SS 형식으로 변환 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/** 분 단위를 한글 형식으로 변환 (예: 5분, 1시간 30분) */
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
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

