import type { Meta, StoryObj } from "@storybook/react";
import { TaskItem } from "./TaskItem";
import { TaskStatus, TaskPriority, Task } from "@entities/task";
import { useState } from "react";

/**
 * TaskItem은 할일 목록에서 개별 태스크를 표시하는 컴포넌트입니다.
 *
 * ## 핵심 기능
 * - **Play 버튼**: 작업 시작의 명확한 신호
 * - **Pause 버튼**: 일시정지, 문맥 보존
 * - **원형 프로그레스**: 진행률을 시각적으로 표시
 * - **기대 작업 시간**: 각 태스크의 예상 소요 시간 표시
 * - **긴급도 표시**: 시간이 다 되어갈수록 색상과 애니메이션 변화
 *
 * ## 상태별 표시
 * - **INBOX**: 기본 상태, 빈 원형 프로그레스, Play 버튼으로 시작 가능
 * - **IN_PROGRESS**: 타이머 진행 중, 프로그레스 바 표시, 펄스 애니메이션
 * - **PAUSED**: 일시정지, 노란색 일시정지 아이콘, 진행률 유지
 * - **COMPLETED**: 완료됨, 녹색 체크 표시
 *
 * ## 원형 프로그레스 인디케이터
 * - 시작 전: 빈 원 (회색)
 * - 진행 중: 진행률만큼 채워진 원 (주황색/노란색/빨간색)
 * - 일시정지: 진행률 유지 + 일시정지 아이콘 (노란색)
 * - 완료: 녹색 체크마크
 */
const meta: Meta<typeof TaskItem> = {
  title: "Features/Tasks/TaskItem",
  component: TaskItem,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Slacker의 핵심 컴포넌트. 작업의 시간 추적과 집중 상태를 시각화합니다.",
      },
    },
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#1C1A23" }],
    },
  },
  argTypes: {
    task: {
      description: "표시할 태스크 객체 (expectedDuration으로 기대 시간 설정)",
      control: "object",
    },
    isSelected: {
      description: "선택된 상태 여부",
      control: "boolean",
    },
    onOpenDetail: {
      description: "외부 창으로 열기 핸들러",
      action: "openDetail",
    },
    onStatusChange: {
      description: "상태 변경 핸들러 (Play/Pause 시 호출)",
      action: "statusChanged",
    },
    onAddNote: {
      description: "메모 추가 핸들러",
      action: "addNote",
    },
    onAddTag: {
      description: "태그 추가 핸들러",
      action: "addTag",
    },
    onRemoveTag: {
      description: "태그 제거 핸들러",
      action: "removeTag",
    },
    onToggleImportant: {
      description: "중요 표시 토글 핸들러",
      action: "toggleImportant",
    },
    onDelete: {
      description: "삭제 핸들러",
      action: "delete",
    },
    onTargetDateChange: {
      description: "목표일 변경 핸들러",
      action: "targetDateChange",
    },
    onArchive: {
      description: "보관함 이동 핸들러",
      action: "archive",
    },
    defaultDuration: {
      description: "타이머 기본 시간 (초 단위, 미설정시 task.expectedDuration 사용)",
      control: { type: "number", min: 10, max: 600, step: 10 },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-[#1C1A23] p-6 min-w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskItem>;

// Mock 데이터 - 기대 작업 시간 포함
const mockInboxTask: Task = {
  id: "1",
  title: "피드백 기능 추가",
  priority: TaskPriority.HIGH,
  status: TaskStatus.INBOX,
  totalTimeSpent: 0,
  expectedDuration: 5, // 5분
  createdAt: new Date(),
  targetDate: new Date(),
  tags: ["프론트엔드", "기능"],
  isImportant: true,
};

const mockInProgressTask: Task = {
  id: "2",
  title: "API 연동 작업 진행 중",
  priority: TaskPriority.HIGH,
  status: TaskStatus.IN_PROGRESS,
  totalTimeSpent: 15,
  expectedDuration: 10, // 10분
  createdAt: new Date(),
  targetDate: new Date(),
  tags: ["API"],
  notes: [
    { id: "n1", content: "인증 토큰 갱신 로직 확인 필요", createdAt: new Date(Date.now() - 3600000) },
  ],
};

const mockPausedTask: Task = {
  id: "3",
  title: "DB 마이그레이션 - 일시정지됨",
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.PAUSED,
  totalTimeSpent: 45,
  expectedDuration: 30, // 30분
  createdAt: new Date(),
  lastPausedAt: new Date(),
  targetDate: new Date(),
  tags: ["백엔드", "DB"],
};

const mockCompletedTask: Task = {
  id: "4",
  title: "앱 홍보 이미지 제작",
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.COMPLETED,
  totalTimeSpent: 120,
  expectedDuration: 60, // 1시간
  createdAt: new Date(),
  completedAt: new Date(),
  tags: ["디자인"],
};

const mockLongTitleTask: Task = {
  id: "5",
  title: "데이터베이스 마이그레이션 및 스키마 업데이트 작업 진행",
  priority: TaskPriority.HIGH,
  status: TaskStatus.INBOX,
  totalTimeSpent: 0,
  expectedDuration: 120, // 2시간
  createdAt: new Date(),
  targetDate: new Date(Date.now() + 86400000), // 내일
  tags: ["백엔드", "DB", "마이그레이션"],
};

// 메모와 태그가 많은 태스크
const mockTaskWithNotes: Task = {
  id: "6",
  title: "복잡한 기능 구현",
  priority: TaskPriority.HIGH,
  status: TaskStatus.INBOX,
  totalTimeSpent: 0,
  expectedDuration: 60,
  createdAt: new Date(),
  targetDate: new Date(),
  tags: ["프론트엔드", "API", "중요"],
  isImportant: true,
  notes: [
    { id: "n1", content: "요구사항 정리 완료", createdAt: new Date(Date.now() - 7200000) },
    { id: "n2", content: "디자인 팀과 미팅 예정", createdAt: new Date(Date.now() - 3600000) },
    { id: "n3", content: "API 스펙 확인 필요", createdAt: new Date() },
  ],
};

/**
 * 기본 상태 (INBOX) - 시작 전
 * 빈 원형 프로그레스와 기대 작업 시간이 표시됩니다.
 */
export const Default: Story = {
  args: {
    task: mockInboxTask,
    isSelected: false,
  },
};

/**
 * 선택된 태스크 - 주황색 배경
 */
export const Selected: Story = {
  args: {
    task: mockInboxTask,
    isSelected: true,
  },
};

/**
 * 진행 중 (IN_PROGRESS) - 타이머 동작 중
 * 원형 프로그레스가 진행률을 표시합니다.
 */
export const InProgress: Story = {
  args: {
    task: mockInProgressTask,
    isSelected: false,
    defaultDuration: 30, // 데모용 30초
  },
};

/**
 * 일시정지 (PAUSED) - 노란색 일시정지 아이콘
 * 원형 프로그레스에 일시정지 표시가 나타납니다.
 */
export const Paused: Story = {
  args: {
    task: mockPausedTask,
    isSelected: false,
  },
};

/**
 * 완료된 태스크 - 녹색 체크 아이콘
 */
export const Completed: Story = {
  args: {
    task: mockCompletedTask,
    isSelected: false,
  },
};

/**
 * 긴급 상태 (시간 거의 소진)
 * 빨간색 펄스 효과와 불꽃 아이콘이 표시됩니다.
 */
export const CriticalUrgency: Story = {
  args: {
    task: {
      ...mockInProgressTask,
      id: "critical",
      title: "긴급! 마감이 임박한 작업",
    },
    isSelected: false,
    defaultDuration: 10,
  },
};

/**
 * 긴 제목의 태스크 - 2시간 기대 시간
 */
export const LongTitle: Story = {
  args: {
    task: mockLongTitleTask,
    isSelected: false,
  },
};

/**
 * 다양한 기대 작업 시간 비교
 * 5분, 15분, 30분, 1시간, 2시간 등 다양한 기대 시간을 가진 태스크들
 */
const ExpectedDurationsDemo = () => {
  const tasks: Task[] = [
    { ...mockInboxTask, id: "5min", title: "짧은 작업 (5분)", expectedDuration: 5 },
    { ...mockInboxTask, id: "15min", title: "일반 작업 (15분)", expectedDuration: 15 },
    { ...mockInboxTask, id: "30min", title: "중간 작업 (30분)", expectedDuration: 30 },
    { ...mockInboxTask, id: "1hour", title: "긴 작업 (1시간)", expectedDuration: 60 },
    { ...mockInboxTask, id: "2hour", title: "대형 작업 (2시간)", expectedDuration: 120 },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-gray-400 mb-2">
        각 태스크의 기대 작업 시간이 표시됩니다.
      </div>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
};

export const ExpectedDurations: Story = {
  render: () => <ExpectedDurationsDemo />,
  parameters: {
    docs: {
      description: {
        story: "다양한 기대 작업 시간을 가진 태스크들을 비교합니다. 각 row에 기대 시간이 표시됩니다.",
      },
    },
  },
};

/**
 * 진행률 비교 - 시작 전 vs 일부 진행
 * 원형 프로그레스로 진행 상태를 시각적으로 구분합니다.
 */
const ProgressComparisonDemo = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { ...mockInboxTask, id: "not-started", title: "시작 전 (0%)", expectedDuration: 5 },
    { ...mockInboxTask, id: "25-progress", title: "25% 진행됨", status: TaskStatus.PAUSED, expectedDuration: 10 },
    { ...mockInboxTask, id: "50-progress", title: "50% 진행됨", status: TaskStatus.PAUSED, expectedDuration: 10 },
    { ...mockInboxTask, id: "75-progress", title: "75% 진행됨", status: TaskStatus.PAUSED, expectedDuration: 10 },
  ]);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // 각 진행률에 맞게 defaultDuration 조정
  const getDuration = (taskId: string) => {
    switch (taskId) {
      case "not-started": return 60;
      case "25-progress": return 16; // 25% 진행 = 12초 남음 (16초 중)
      case "50-progress": return 20; // 50% 진행 = 10초 남음 (20초 중)
      case "75-progress": return 24; // 75% 진행 = 6초 남음 (24초 중)
      default: return 60;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-gray-400 mb-2 space-y-1">
        <p>⭕ <span className="text-gray-500">시작 전</span>: 빈 원</p>
        <p>🟠 <span className="text-[#FF6B00]">진행 중</span>: 진행률만큼 채워진 원</p>
        <p>🟡 <span className="text-yellow-500">일시정지</span>: 진행률 + 일시정지 아이콘</p>
      </div>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStatusChange={(status) => handleStatusChange(task.id, status)}
          defaultDuration={getDuration(task.id)}
        />
      ))}
    </div>
  );
};

export const ProgressComparison: Story = {
  render: () => <ProgressComparisonDemo />,
  parameters: {
    docs: {
      description: {
        story: "시작 전과 진행 중인 태스크의 원형 프로그레스 차이를 비교합니다. Play 버튼을 눌러 진행률 변화를 확인하세요.",
      },
    },
  },
};

/**
 * 인터랙티브 데모 - 상태 전환 테스트
 */
const InteractiveDemo = () => {
  const [task, setTask] = useState<Task>({
    ...mockInboxTask,
    expectedDuration: 1, // 1분 데모
  });

  const handleStatusChange = (newStatus: TaskStatus) => {
    setTask((prev) => ({ ...prev, status: newStatus }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-400 mb-2">
        현재 상태: <span className="text-[#FF6B00] font-bold">{task.status}</span>
      </div>
      <TaskItem
        task={task}
        onStatusChange={handleStatusChange}
        defaultDuration={60} // 1분 데모
      />
      <div className="flex gap-2 mt-4">
        <button
          onClick={() =>
            setTask((prev) => ({ ...prev, status: TaskStatus.INBOX }))
          }
          className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
        >
          리셋 (INBOX)
        </button>
        <button
          onClick={() =>
            setTask((prev) => ({ ...prev, status: TaskStatus.COMPLETED }))
          }
          className="px-3 py-1.5 text-xs bg-green-700 text-white rounded hover:bg-green-600"
        >
          완료
        </button>
      </div>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Play/Pause 버튼을 클릭하여 상태 전환을 테스트하세요. 원형 프로그레스가 진행률을 표시합니다.",
      },
    },
  },
};

/**
 * 모든 상태 한눈에 보기
 */
const AllStatesDemo = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { ...mockInboxTask, id: "inbox", title: "INBOX - 아직 시작하지 않은 작업", expectedDuration: 5 },
    { ...mockInProgressTask, id: "progress", title: "IN_PROGRESS - 진행 중인 작업", expectedDuration: 10 },
    { ...mockPausedTask, id: "paused", title: "PAUSED - 일시정지된 작업", expectedDuration: 30 },
    { ...mockCompletedTask, id: "completed", title: "COMPLETED - 완료된 작업", expectedDuration: 60 },
  ]);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStatusChange={(status) => handleStatusChange(task.id, status)}
          defaultDuration={30}
        />
      ))}
    </div>
  );
};

export const AllStates: Story = {
  render: () => <AllStatesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "모든 상태(INBOX, IN_PROGRESS, PAUSED, COMPLETED)를 한눈에 볼 수 있습니다. 원형 프로그레스와 기대 시간이 각 상태에 맞게 표시됩니다.",
      },
    },
  },
};

/**
 * 시간 변화에 따른 UI 변화 시뮬레이션
 */
const UrgencyProgressionDemo = () => {
  const [task, setTask] = useState<Task>({
    ...mockInProgressTask,
    id: "urgency-demo",
    title: "시간 변화 관찰 - 15초 타이머",
    expectedDuration: 1, // 1분
  });

  const handleStatusChange = (newStatus: TaskStatus) => {
    setTask((prev) => ({ ...prev, status: newStatus }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-400 space-y-1">
        <p>🟢 <span className="text-[#FF6B00]">50% 이상</span>: 정상 상태 (주황색)</p>
        <p>🟡 <span className="text-yellow-500">20~50%</span>: 경고 상태 (노란색 + ⚡)</p>
        <p>🔴 <span className="text-red-500">20% 미만</span>: 긴급 상태 (빨간색 + 🔥 + 펄스)</p>
      </div>
      <TaskItem
        task={task}
        onStatusChange={handleStatusChange}
        defaultDuration={15}
      />
      <button
        onClick={() => {
          setTask((prev) => ({ ...prev, status: TaskStatus.INBOX }));
          setTimeout(() => {
            setTask((prev) => ({ ...prev, status: TaskStatus.IN_PROGRESS }));
          }, 100);
        }}
        className="px-3 py-1.5 text-xs bg-[#FF6B00] text-white rounded hover:bg-[#FF8A3D]"
      >
        타이머 리셋 및 재시작
      </button>
    </div>
  );
};

export const UrgencyProgression: Story = {
  render: () => <UrgencyProgressionDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "15초 타이머를 통해 시간 경과에 따른 긴급도 변화를 관찰할 수 있습니다. 원형 프로그레스의 색상도 함께 변화합니다.",
      },
    },
  },
};

/**
 * 메모, 태그, 중요표시 기능 데모
 * row를 클릭하여 확장하면 새로운 기능들을 테스트할 수 있습니다.
 */
const ExpandedFeaturesDemo = () => {
  const [task, setTask] = useState<Task>(mockTaskWithNotes);

  const handleAddNote = (note: { id: string; content: string; createdAt: Date }) => {
    setTask((prev) => ({
      ...prev,
      notes: [...(prev.notes || []), note],
    }));
  };

  const handleAddTag = (tag: string) => {
    if (!task.tags?.includes(tag)) {
      setTask((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTask((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag),
    }));
  };

  const handleToggleImportant = () => {
    setTask((prev) => ({
      ...prev,
      isImportant: !prev.isImportant,
    }));
  };

  const handleTargetDateChange = (date: Date) => {
    setTask((prev) => ({
      ...prev,
      targetDate: date,
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-400 space-y-1">
        <p>✨ <span className="text-blue-400">Row 클릭</span>하여 확장 메뉴 열기</p>
        <p>📝 메모 남기기 (현재 시간 자동 기록)</p>
        <p>🏷️ #태그 추가/제거</p>
        <p>⭐ 중요 표시 토글</p>
        <p>📅 내일로 미루기 / 보관함 이동</p>
      </div>
      <TaskItem
        task={task}
        onAddNote={handleAddNote}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onToggleImportant={handleToggleImportant}
        onTargetDateChange={handleTargetDateChange}
        onDelete={() => alert("삭제 버튼 클릭!")}
        onArchive={() => alert("보관함 이동!")}
      />
    </div>
  );
};

export const ExpandedFeatures: Story = {
  render: () => <ExpandedFeaturesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "태스크 확장 시 메모, 태그, 중요표시, 목표일 변경 등 다양한 기능을 테스트할 수 있습니다. Row를 클릭하여 확장하세요.",
      },
    },
  },
};

/**
 * 태그 표시 데모 - 축소 상태에서 태그 미리보기
 */
const TagsPreviewDemo = () => {
  const tasks: Task[] = [
    { ...mockInboxTask, id: "t1", title: "태그 없음", tags: undefined },
    { ...mockInboxTask, id: "t2", title: "태그 1개", tags: ["프론트엔드"] },
    { ...mockInboxTask, id: "t3", title: "태그 2개", tags: ["API", "백엔드"] },
    { ...mockInboxTask, id: "t4", title: "태그 4개 (2개만 표시)", tags: ["API", "백엔드", "중요", "긴급"] },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-gray-400 mb-2">
        축소 상태에서 최대 2개의 태그가 미리보기로 표시됩니다.
      </div>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
};

export const TagsPreview: Story = {
  render: () => <TagsPreviewDemo />,
  parameters: {
    docs: {
      description: {
        story: "축소 상태에서 태그가 어떻게 미리보기되는지 확인합니다. 3개 이상이면 +N 형태로 표시됩니다.",
      },
    },
  },
};
