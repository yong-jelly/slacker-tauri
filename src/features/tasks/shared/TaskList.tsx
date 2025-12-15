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
}: TaskListProps) => {
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
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
        />
      ))}
    </div>
  );
};
