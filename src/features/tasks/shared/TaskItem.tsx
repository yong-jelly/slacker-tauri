import { Task, TaskStatus } from "@entities/task";
import { CheckCircle2, Circle } from "lucide-react";

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
        flex items-center gap-4 px-6 h-[50px] cursor-pointer transition-colors
        ${isSelected ? "bg-blue-600 text-white rounded-xl" : "text-gray-200 hover:bg-[#35373C]"}
      `}
    >
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle2 className={`w-6 h-6 ${isSelected ? "text-white" : "text-orange-500"}`} fill="currentColor" />
        ) : (
          <Circle className={`w-6 h-6 ${isSelected ? "text-white/80" : "text-gray-500"}`} strokeWidth={2} />
        )}
      </div>
      <span className="flex-1 text-base font-medium">{task.title}</span>
      {isSelected && (
        <div className="w-5 h-5 bg-white/90 rounded flex-shrink-0" />
      )}
    </div>
  );
};

