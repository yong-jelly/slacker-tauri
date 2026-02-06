import { useState, useCallback, useEffect } from "react";
import { Task } from "@entities/task";

interface UseTaskKeyboardNavigationProps {
  tasks: Task[];
  onSelect?: (taskId: string) => void;
}

export const useTaskKeyboardNavigation = ({ tasks, onSelect }: UseTaskKeyboardNavigationProps) => {
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  // 태스크 목록이 변경되면 포커스 유효성 검사
  useEffect(() => {
    if (focusedTaskId && !tasks.find((t) => t.id === focusedTaskId)) {
      setFocusedTaskId(null);
    }
  }, [tasks, focusedTaskId]);

  const moveFocus = useCallback(
    (direction: "up" | "down") => {
      if (tasks.length === 0) return;

      const currentIndex = focusedTaskId
        ? tasks.findIndex((t) => t.id === focusedTaskId)
        : -1;

      let nextIndex = -1;

      if (direction === "down") {
        if (currentIndex === -1 || currentIndex === tasks.length - 1) {
          nextIndex = 0;
        } else {
          nextIndex = currentIndex + 1;
        }
      } else {
        if (currentIndex === -1 || currentIndex === 0) {
          nextIndex = tasks.length - 1;
        } else {
          nextIndex = currentIndex - 1;
        }
      }

      if (nextIndex !== -1) {
        setFocusedTaskId(tasks[nextIndex].id);
        
        // 스크롤 처리
        const element = document.getElementById(`task-item-${tasks[nextIndex].id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    },
    [tasks, focusedTaskId]
  );

  const handleEnter = useCallback(() => {
    if (focusedTaskId && onSelect) {
      onSelect(focusedTaskId);
    }
  }, [focusedTaskId, onSelect]);

  return {
    focusedTaskId,
    setFocusedTaskId,
    moveFocus,
    handleEnter,
  };
};
