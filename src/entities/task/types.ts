export enum TaskStatus {
  INBOX = "INBOX",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

/** 짧은 메모 항목 */
export interface TaskMemo {
  id: string;
  content: string;
  createdAt: Date;
}

/** 긴 노트 항목 (상세 기록용) */
export interface TaskNote {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

/** 실행 히스토리 항목 */
export interface TaskRunHistory {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  /** 실행 시간 (초 단위) */
  duration: number;
  /** 종료 타입: 완료, 일시정지, 타이머종료 */
  endType: "completed" | "paused" | "timeout" | "interrupted";
}

/** 시간 추가 히스토리 항목 */
export interface TimeExtensionHistory {
  id: string;
  /** 추가된 시간 (분 단위) */
  addedMinutes: number;
  /** 추가 전 예상 시간 (분 단위) */
  previousDuration: number;
  /** 추가 후 예상 시간 (분 단위) */
  newDuration: number;
  /** 추가 시점 */
  createdAt: Date;
  /** 추가 사유 (선택) */
  reason?: string;
}

export interface Task {
  id: string;
  slackMessageId?: string;
  title: string;
  description?: string;
  url?: string;
  priority: TaskPriority;
  status: TaskStatus;
  totalTimeSpent: number; // 분 단위
  /** 기대 작업 시간 (분 단위), 기본값 5분 */
  expectedDuration?: number;
  createdAt: Date;
  completedAt?: Date;
  lastPausedAt?: Date;
  /** 마지막 실행 시작 시간 */
  lastRunAt?: Date;
  /** 목표 완료일 */
  targetDate?: Date;
  /** 태그 목록 (# 제외) */
  tags?: string[];
  /** 짧은 메모 목록 (row 확장에서 사용) */
  memos?: TaskMemo[];
  /** 긴 노트 목록 (더보기 팝업에서 사용) */
  notes?: TaskNote[];
  /** 실행 히스토리 */
  runHistory?: TaskRunHistory[];
  /** 시간 추가 히스토리 */
  timeExtensions?: TimeExtensionHistory[];
  /** 중요 표시 여부 */
  isImportant?: boolean;
}

