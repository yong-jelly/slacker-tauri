import { HashRouter, Routes, Route, useParams } from "react-router-dom";
import { MainPage } from "@pages/MainPage";
import { TaskDetailPage } from "@pages/TaskDetailPage";
import { Task, TaskStatus, TaskPriority } from "@entities/task";

// Mock 데이터 (실제로는 상태 관리나 API에서 가져와야 함)
const getTaskById = (id: string): Task | null => {
  const allTasks: Task[] = [
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
  return allTasks.find((t) => t.id === id) || null;
};

export const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route
          path="/task/:id"
          element={<TaskDetailPageWrapper getTaskById={getTaskById} />}
        />
      </Routes>
    </HashRouter>
  );
};

const TaskDetailPageWrapper = ({
  getTaskById,
}: {
  getTaskById: (id: string) => Task | null;
}) => {
  const { id } = useParams<{ id: string }>();
  const task = id ? getTaskById(id) : null;

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200/40 via-purple-200/40 to-orange-200/40 backdrop-blur-2xl p-6 flex items-center justify-center">
        <div className="text-white">작업을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return <TaskDetailPage task={task} />;
};

