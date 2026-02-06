/**
 * 긴급도 관련 유틸리티
 */

export type UrgencyLevel = "normal" | "warning" | "critical";

export interface UrgencyColors {
  bg: string;
  border: string;
  glow: string;
  progress: string;
}

/** 진행률에 따른 긴급도 레벨 계산 */
export const getUrgencyLevel = (progress: number): UrgencyLevel => {
  if (progress > 0.5) return "normal";
  if (progress > 0.2) return "warning";
  return "critical";
};

/** 긴급도 레벨에 따른 색상 반환 */
export const getUrgencyColors = (urgencyLevel: UrgencyLevel): UrgencyColors => {
  switch (urgencyLevel) {
    case "critical":
      return { 
        bg: "rgba(239, 68, 68, 0.1)", 
        border: "rgba(239, 68, 68, 0.3)", 
        glow: "rgba(239, 68, 68, 0.15)", 
        progress: "rgba(239, 68, 68, 0.4)" 
      };
    case "warning":
      return { 
        bg: "rgba(251, 191, 36, 0.08)", 
        border: "rgba(251, 191, 36, 0.25)", 
        glow: "rgba(251, 191, 36, 0.1)", 
        progress: "rgba(251, 191, 36, 0.35)" 
      };
    default:
      return { 
        bg: "rgba(255, 107, 0, 0.05)", 
        border: "rgba(255, 107, 0, 0.25)", 
        glow: "rgba(255, 107, 0, 0.1)", 
        progress: "rgba(255, 107, 0, 0.35)" 
      };
  }
};

/** 긴급도 레벨에 따른 상태 텍스트 */
export const getUrgencyStatusText = (urgencyLevel: UrgencyLevel): string => {
  switch (urgencyLevel) {
    case "critical":
      return "집중!";
    case "warning":
      return "진행 중";
    default:
      return "시작됨";
  }
};

