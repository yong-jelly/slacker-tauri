import { Task, TaskStatus } from "@entities/task";
import { Checkbox } from "@shared/ui";
import { Circle } from "lucide-react";

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onClick?: () => void;
}

export const TaskItem = ({ task, isSelected = false, onClick }: TaskItemProps) => {
  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-4 px-5 py-3 cursor-pointer transition-all rounded-xl
        ${isSelected 
          ? "bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20" 
          : "bg-[#2B2D31] text-gray-200 hover:bg-[#35373C]"
        }
      `}
    >
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {isCompleted ? (
          <Checkbox
            checked={true}
            checkedColor="#F47314"
            size="md"
            onChange={() => {}}
          />
        ) : (
          <Circle 
            className={`w-5 h-5 ${isSelected ? "text-white/80" : "text-gray-500"}`} 
            strokeWidth={2} 
          />
        )}
      </div>
      <span className={`flex-1 text-sm font-medium ${isCompleted && !isSelected ? "line-through text-gray-500" : ""}`}>
        {task.title}
      </span>
      {isSelected && (
        <div className="w-4 h-4 bg-white/90 rounded flex-shrink-0" />
      )}
    </div>
  );
};
