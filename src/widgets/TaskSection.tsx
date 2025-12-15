import { Task, TaskStatus } from "@entities/task";
import { TaskList } from "@features/tasks/shared";
import { Input } from "@shared/ui";
import { Plus } from "lucide-react";

interface TaskSectionProps {
  title: string;
  count: number;
  tasks: Task[];
  selectedTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
  placeholder?: string;
  showInput?: boolean;
}

export const TaskSection = ({
  title,
  count,
  tasks,
  selectedTaskId,
  onTaskSelect,
  placeholder = "새 할 일...",
  showInput = false,
}: TaskSectionProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-400">
          {title}
        </h2>
        <span className="text-base font-medium text-gray-500">{count}</span>
      </div>

      {showInput && (
        <div className="relative">
          <Input
            type="text"
            placeholder={placeholder}
            className="pr-12 bg-[#27252E] border-0 rounded-xl text-base"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      <TaskList
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        onTaskSelect={onTaskSelect}
      />
    </div>
  );
};

