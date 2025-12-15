import { useState } from "react";
import { Task, TaskStatus, TaskPriority } from "@entities/task";
import { TaskSection } from "@widgets";
import { User, Coffee } from "lucide-react";
import { openTaskWindow } from "@shared/lib/openTaskWindow";

export const MainPage = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  // Mock 데이터
  const inboxTasks: Task[] = [
    {
      id: "1",
      title: "피드백 기능 추가",
      priority: TaskPriority.HIGH,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "타이머 추가",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      createdAt: new Date(),
    },
    {
      id: "6",
      title: "데이터베이스 마이그레이션",
      priority: TaskPriority.HIGH,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      createdAt: new Date(),
    },
    {
      id: "7",
      title: "API 문서 작성",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      createdAt: new Date(),
    },
    {
      id: "8",
      title: "성능 최적화",
      priority: TaskPriority.LOW,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      createdAt: new Date(),
    },
    {
      id: "9",
      title: "테스트 코드 작성",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      createdAt: new Date(),
    },
  ];

  const completedTasks: Task[] = [
    {
      id: "3",
      title: "앱 홍보 이미지 제작",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      totalTimeSpent: 120,
      createdAt: new Date(),
      completedAt: new Date(),
    },
    {
      id: "4",
      title: "CSS 레이아웃",
      priority: TaskPriority.LOW,
      status: TaskStatus.COMPLETED,
      totalTimeSpent: 45,
      createdAt: new Date(),
      completedAt: new Date(),
    },
    {
      id: "5",
      title: "피인 건 전기",
      priority: TaskPriority.LOW,
      status: TaskStatus.COMPLETED,
      totalTimeSpent: 30,
      createdAt: new Date(),
      completedAt: new Date(),
    },
  ];

  const handleTaskSelect = async (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = inboxTasks.find((t) => t.id === taskId);
    if (task) {
      await openTaskWindow(task);
    }
  };

  return (
    <div className="h-screen bg-[#1C1A23] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button className="text-gray-400 hover:text-white transition-colors">
          <User className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Coffee className="w-5 h-5" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        <TaskSection
          title="할일"
          count={6}
          tasks={inboxTasks}
          selectedTaskId={selectedTaskId}
          onTaskSelect={handleTaskSelect}
          showInput={true}
        />

        <TaskSection
          title="완료"
          count={3}
          tasks={completedTasks}
          selectedTaskId={undefined}
          onTaskSelect={undefined}
        />
      </div>
    </div>
  );
};

