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

export interface Task {
  id: string;
  slackMessageId?: string;
  title: string;
  description?: string;
  url?: string;
  priority: TaskPriority;
  status: TaskStatus;
  totalTimeSpent: number; // 분 단위
  createdAt: Date;
  completedAt?: Date;
  lastPausedAt?: Date;
}

