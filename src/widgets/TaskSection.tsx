import { Task, TaskStatus, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";
import { TaskList } from "@features/tasks/shared";
import { AddTaskForm } from "@features/tasks/shared/ui/AddTaskForm";
import type { StatusChangeOptions, SortType } from "@features/tasks/shared/types";
import { Inbox, PlayCircle, PauseCircle, CheckCircle2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { SortDropdown } from "@shared/ui";

interface TaskSectionProps {
  title: string;
  count: number;
  tasks: Task[];
  selectedTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus, options?: StatusChangeOptions) => void;
  onAddMemo?: (taskId: string, memo: TaskMemo) => void;
  onAddNote?: (taskId: string, note: TaskNote) => void;
  onAddTag?: (taskId: string, tag: string) => void;
  onRemoveTag?: (taskId: string, tag: string) => void;
  onToggleImportant?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTargetDateChange?: (taskId: string, date: Date) => void;
  onArchive?: (taskId: string) => void;
  onExtendTime?: (taskId: string, extension: TimeExtensionHistory) => void;
  onTitleChange?: (taskId: string, title: string) => void;
  /** Task 추가 UI 표시 여부 (할일 섹션용) */
  showAddTaskForm?: boolean;
  /** Task 추가 핸들러 */
  onAddTask?: (title: string, targetDate: Date, expectedDuration: number) => void;
  /** Task 추가 UI 닫기 핸들러 */
  onCloseAddTask?: () => void;
  /** Task 추가 폼의 초기 목표일 */
  initialTargetDate?: "today" | "tomorrow";
  /** 섹션 타입 (빈 상태 아이콘 결정용) */
  sectionType?: "inProgress" | "paused" | "inbox" | "completed";
  /** 현재 정렬 타입 */
  sortType?: SortType;
  /** 정렬 타입 변경 핸들러 */
  onSortChange?: (sortType: SortType) => void;
  /** 태스크 순서 변경 핸들러 (드래그앤드롭) */
  onTasksReorder?: (taskIds: string[]) => void;
  /** 키보드 포커스된 태스크 ID */
  focusedTaskId?: string | null;
}

// 섹션 타입에 따른 빈 상태 정보
const getEmptyStateInfo = (sectionType?: string) => {
  switch (sectionType) {
    case "inProgress":
      return {
        icon: PlayCircle,
        text: "진행 중인 작업이 없습니다",
        subtext: "할일에서 Play 버튼을 눌러 시작하세요",
        color: "text-[#FF6B00]",
      };
    case "paused":
      return {
        icon: PauseCircle,
        text: "일시정지된 작업이 없습니다",
        subtext: "",
        color: "text-yellow-500",
      };
    case "inbox":
      return {
        icon: Inbox,
        text: "할일이 없습니다",
        subtext: "새 작업을 추가해보세요",
        color: "text-gray-500",
      };
    case "completed":
      return {
        icon: CheckCircle2,
        text: "완료된 작업이 없습니다",
        subtext: "",
        color: "text-green-500",
      };
    default:
      return {
        icon: Inbox,
        text: "항목이 없습니다",
        subtext: "",
        color: "text-gray-500",
      };
  }
};

export const TaskSection = ({
  title,
  count,
  tasks,
  selectedTaskId,
  onTaskSelect,
  onStatusChange,
  onAddMemo,
  onAddNote,
  onAddTag,
  onRemoveTag,
  onToggleImportant,
  onDelete,
  onTargetDateChange,
  onArchive,
  onExtendTime,
  onTitleChange,
  showAddTaskForm,
  onAddTask,
  onCloseAddTask,
  initialTargetDate,
  sectionType,
  sortType = "created",
  onSortChange,
  onTasksReorder,
  focusedTaskId,
}: TaskSectionProps) => {
  const emptyState = getEmptyStateInfo(sectionType);
  const EmptyIcon = emptyState.icon;
  const isEmpty = tasks.length === 0;
  // 아이템이 2개 이상일 때만 정렬 드롭다운 표시
  const showSortDropdown = tasks.length >= 2 && onSortChange;

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-400">{title}</h2>
          <span className="text-base font-medium text-gray-500">{count}</span>
        </div>
        {showSortDropdown && (
          <SortDropdown value={sortType} onChange={onSortChange} />
        )}
      </div>

      {/* Task 추가 폼 (할일 섹션에만 표시) */}
      <AnimatePresence>
        {showAddTaskForm && onAddTask && (
          <AddTaskForm
            onSubmit={onAddTask}
            onCancel={onCloseAddTask}
            initialTargetDate={initialTargetDate}
          />
        )}
      </AnimatePresence>

      {isEmpty ? (
        // 빈 상태 UI
        <div className="flex items-center gap-3 px-5 py-4 bg-[#2B2D31]/50 rounded-xl border border-dashed border-gray-700">
          <EmptyIcon className={`w-5 h-5 ${emptyState.color} opacity-50`} />
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">{emptyState.text}</span>
            {emptyState.subtext && (
              <span className="text-xs text-gray-600">{emptyState.subtext}</span>
            )}
          </div>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onTaskSelect={onTaskSelect}
          onStatusChange={onStatusChange}
          onAddMemo={onAddMemo}
          onAddNote={onAddNote}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onToggleImportant={onToggleImportant}
          onDelete={onDelete}
          onTargetDateChange={onTargetDateChange}
          onArchive={onArchive}
          onExtendTime={onExtendTime}
          onTitleChange={onTitleChange}
          enableDragDrop={sortType === "custom" || !!onTasksReorder}
          onReorder={onTasksReorder}
          focusedTaskId={focusedTaskId}
        />
      )}
    </div>
  );
};
