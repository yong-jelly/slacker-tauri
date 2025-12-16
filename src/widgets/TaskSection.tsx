import { Task, TaskStatus, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";
import { TaskList } from "@features/tasks/shared";
import { AddTaskForm } from "@features/tasks/shared/ui/AddTaskForm";
import { Inbox, PlayCircle, PauseCircle, CheckCircle2 } from "lucide-react";
import { AnimatePresence } from "motion/react";

interface TaskSectionProps {
  title: string;
  count: number;
  tasks: Task[];
  selectedTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
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
  /** 섹션 타입 (빈 상태 아이콘 결정용) */
  sectionType?: "inProgress" | "paused" | "inbox" | "completed";
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
  sectionType,
}: TaskSectionProps) => {
  const emptyState = getEmptyStateInfo(sectionType);
  const EmptyIcon = emptyState.icon;
  const isEmpty = tasks.length === 0;

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-400">{title}</h2>
        <span className="text-base font-medium text-gray-500">{count}</span>
      </div>

      {/* Task 추가 폼 (할일 섹션에만 표시) */}
      <AnimatePresence>
        {showAddTaskForm && onAddTask && (
          <AddTaskForm
            onSubmit={onAddTask}
            onCancel={onCloseAddTask}
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
        />
      )}
    </div>
  );
};
