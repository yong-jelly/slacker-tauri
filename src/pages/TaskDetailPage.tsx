import { Task } from "@entities/task";
import { Input } from "@shared/ui";
import { Plus, Play } from "lucide-react";

interface TaskDetailPageProps {
  task: Task;
}

export const TaskDetailPage = ({ task }: TaskDetailPageProps) => {
  return (
    <div className="min-h-screen bg-black p-6 flex flex-col gap-4">
      {/* 제목 - 주황색 큰 글씨 */}
      <h1 className="text-2xl font-bold text-orange-500">{task.title}</h1>
      
      {/* 새할일 입력 + 아이콘들 */}
      <div className="relative">
        <Input
          type="text"
          placeholder="새 할 일..."
          className="pr-28 bg-[#27252E] border-0 rounded-xl text-lg font-semibold"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <button className="text-white hover:text-orange-500 transition-colors">
            <Plus className="w-8 h-8" />
          </button>
          <button className="text-white hover:text-orange-500 transition-colors">
            <Play className="w-7 h-7" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};

