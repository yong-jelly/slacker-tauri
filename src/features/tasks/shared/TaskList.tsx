import { useState, useCallback } from "react";
import { Task, TaskStatus, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
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
}

export const TaskList = ({
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
}: TaskListProps) => {
  // 아코디언: 하나의 TaskItem만 펼쳐지도록 관리
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
          isExpanded={expandedTaskId === task.id}
          onToggleExpand={() => handleToggleExpand(task.id)}
          onOpenDetail={() => onTaskSelect?.(task.id)}
          onStatusChange={(status) => onStatusChange?.(task.id, status)}
          onAddMemo={(memo) => onAddMemo?.(task.id, memo)}
          onAddNote={(note) => onAddNote?.(task.id, note)}
          onAddTag={(tag) => onAddTag?.(task.id, tag)}
          onRemoveTag={(tag) => onRemoveTag?.(task.id, tag)}
          onToggleImportant={() => onToggleImportant?.(task.id)}
          onDelete={() => onDelete?.(task.id)}
          onTargetDateChange={(date) => onTargetDateChange?.(task.id, date)}
          onArchive={() => onArchive?.(task.id)}
          onExtendTime={(ext) => onExtendTime?.(task.id, ext)}
          onTitleChange={(title) => onTitleChange?.(task.id, title)}
        />
      ))}
    </div>
  );
};
