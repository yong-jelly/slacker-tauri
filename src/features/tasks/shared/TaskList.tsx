import { useState, useCallback, useRef } from "react";
import { Task, TaskStatus, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";
import { TaskItem } from "./TaskItem";
import { GripVertical } from "lucide-react";
import type { StatusChangeOptions } from "./types";

interface TaskListProps {
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
  /** 드래그앤드롭 활성화 여부 */
  enableDragDrop?: boolean;
  /** 태스크 순서 변경 핸들러 */
  onReorder?: (taskIds: string[]) => void;
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
  enableDragDrop,
  onReorder,
}: TaskListProps) => {
  // 아코디언: 하나의 TaskItem만 펼쳐지도록 관리
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // 드래그앤드롭 상태
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const dragItemRef = useRef<HTMLDivElement | null>(null);

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    
    // 드래그 이미지를 투명하게 (커스텀 UI 사용)
    const dragImage = document.createElement("div");
    dragImage.style.opacity = "0";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  // 드래그 중 (다른 아이템 위)
  const handleDragOver = useCallback((e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (taskId !== draggedTaskId) {
      setDragOverTaskId(taskId);
    }
  }, [draggedTaskId]);

  // 드래그 떠남
  const handleDragLeave = useCallback(() => {
    setDragOverTaskId(null);
  }, []);

  // 드롭
  const handleDrop = useCallback((e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    // 순서 재배열
    const currentIds = tasks.map(t => t.id);
    const draggedIndex = currentIds.indexOf(draggedTaskId);
    const targetIndex = currentIds.indexOf(targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newIds = [...currentIds];
    newIds.splice(draggedIndex, 1);
    newIds.splice(targetIndex, 0, draggedTaskId);

    onReorder?.(newIds);
    
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  }, [draggedTaskId, tasks, onReorder]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => {
        const isDragging = draggedTaskId === task.id;
        const isDragOver = dragOverTaskId === task.id;
        
        return (
          <div
            key={task.id}
            ref={isDragging ? dragItemRef : null}
            draggable={enableDragDrop}
            onDragStart={(e) => enableDragDrop && handleDragStart(e, task.id)}
            onDragOver={(e) => enableDragDrop && handleDragOver(e, task.id)}
            onDragLeave={enableDragDrop ? handleDragLeave : undefined}
            onDrop={(e) => enableDragDrop && handleDrop(e, task.id)}
            onDragEnd={enableDragDrop ? handleDragEnd : undefined}
            className={`
              relative group/drag
              ${isDragging ? "opacity-50 scale-[0.98]" : ""}
              ${isDragOver ? "before:absolute before:inset-x-0 before:-top-1 before:h-0.5 before:bg-amber-500 before:rounded-full" : ""}
              transition-all duration-150
            `}
          >
            {/* 드래그 핸들 */}
            {enableDragDrop && (
              <div 
                className={`
                  absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-1
                  opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab
                  ${isDragging ? "cursor-grabbing opacity-100" : ""}
                `}
              >
                <GripVertical className="w-4 h-4 text-slate-500" />
              </div>
            )}
            
            <TaskItem
              task={task}
              isSelected={task.id === selectedTaskId}
              isExpanded={expandedTaskId === task.id}
              onToggleExpand={() => handleToggleExpand(task.id)}
              onOpenDetail={() => onTaskSelect?.(task.id)}
              onStatusChange={(status, options) => onStatusChange?.(task.id, status, options)}
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
          </div>
        );
      })}
    </div>
  );
};
