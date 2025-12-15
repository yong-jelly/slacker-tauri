import { Task, TaskStatus, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";

export interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  /** 외부 창으로 상세 열기 핸들러 */
  onOpenDetail?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  /** 타이머 기본 시간 (초 단위), 기본값은 task.expectedDuration 또는 300초(5분) */
  defaultDuration?: number;
  /** 짧은 메모 추가 핸들러 */
  onAddMemo?: (memo: TaskMemo) => void;
  /** 긴 노트 추가 핸들러 */
  onAddNote?: (note: TaskNote) => void;
  /** 태그 추가 핸들러 */
  onAddTag?: (tag: string) => void;
  /** 태그 제거 핸들러 */
  onRemoveTag?: (tag: string) => void;
  /** 중요 표시 토글 핸들러 */
  onToggleImportant?: () => void;
  /** 삭제 핸들러 */
  onDelete?: () => void;
  /** 목표일 변경 핸들러 */
  onTargetDateChange?: (date: Date) => void;
  /** 보관함으로 이동 핸들러 */
  onArchive?: () => void;
  /** 시간 추가 핸들러 */
  onExtendTime?: (extension: TimeExtensionHistory) => void;
}

export type ModalTabType = "memo" | "note" | "history" | "time";

