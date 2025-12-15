import { Task } from "@entities/task";
import { Input } from "@shared/ui";
import { Plus, Play } from "lucide-react";

interface FloatingTaskWidgetProps {
  task?: Task;
  onAddSubTask?: () => void;
  onPlay?: () => void;
}

export const FloatingTaskWidget = ({
  task,
  onAddSubTask,
  onPlay,
}: FloatingTaskWidgetProps) => {
  return (
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 min-w-[300px] border border-gray-700/50">
      {task ? (
        <div className="flex flex-col gap-3">
          <div className="text-orange-500 font-medium text-sm">{task.title}</div>
          <div className="relative">
            <Input
              type="text"
              placeholder="새 할 일..."
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                onClick={onAddSubTask}
                className="text-white hover:text-orange-500 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={onPlay}
                className="text-white hover:text-orange-500 transition-colors"
              >
                <Play className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-sm">작업을 선택하세요</div>
      )}
    </div>
  );
};

