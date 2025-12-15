import type { Meta, StoryObj } from "@storybook/react";
import { TaskItem } from "./TaskItem";
import { TaskStatus, TaskPriority, Task } from "@entities/task";

/**
 * TaskItem은 할일 목록에서 개별 태스크를 표시하는 컴포넌트입니다.
 * 
 * ## 특징
 * - 선택된 상태에서 주황색 라운드 박스로 강조
 * - 완료된 태스크는 체크 아이콘 표시
 * - 호버 시 배경색 변경
 */
const meta: Meta<typeof TaskItem> = {
  title: "Features/Tasks/TaskItem",
  component: TaskItem,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "할일 목록에서 개별 태스크를 표시하는 row 컴포넌트",
      },
    },
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#1C1A23" }],
    },
  },
  argTypes: {
    task: {
      description: "표시할 태스크 객체",
      control: "object",
    },
    isSelected: {
      description: "선택된 상태 여부",
      control: "boolean",
    },
    onClick: {
      description: "클릭 이벤트 핸들러",
      action: "clicked",
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-[#1C1A23] p-4 min-w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskItem>;

// Mock 데이터
const mockInboxTask: Task = {
  id: "1",
  title: "피드백 기능 추가",
  priority: TaskPriority.HIGH,
  status: TaskStatus.INBOX,
  totalTimeSpent: 0,
  createdAt: new Date(),
};

const mockCompletedTask: Task = {
  id: "2",
  title: "앱 홍보 이미지 제작",
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.COMPLETED,
  totalTimeSpent: 120,
  createdAt: new Date(),
  completedAt: new Date(),
};

const mockLongTitleTask: Task = {
  id: "3",
  title: "데이터베이스 마이그레이션 및 스키마 업데이트 작업 진행",
  priority: TaskPriority.HIGH,
  status: TaskStatus.INBOX,
  totalTimeSpent: 0,
  createdAt: new Date(),
};

/**
 * 기본 상태의 태스크
 */
export const Default: Story = {
  args: {
    task: mockInboxTask,
    isSelected: false,
  },
};

/**
 * 선택된 태스크 - 주황색 배경과 라운드 박스
 */
export const Selected: Story = {
  args: {
    task: mockInboxTask,
    isSelected: true,
  },
};

/**
 * 완료된 태스크 - 주황색 체크 아이콘
 */
export const Completed: Story = {
  args: {
    task: mockCompletedTask,
    isSelected: false,
  },
};

/**
 * 완료된 태스크 + 선택된 상태
 */
export const CompletedAndSelected: Story = {
  args: {
    task: mockCompletedTask,
    isSelected: true,
  },
};

/**
 * 긴 제목의 태스크
 */
export const LongTitle: Story = {
  args: {
    task: mockLongTitleTask,
    isSelected: false,
  },
};

/**
 * 여러 태스크 목록 예시
 */
export const TaskList: Story = {
  render: () => (
    <div className="flex flex-col">
      <TaskItem task={mockInboxTask} isSelected={false} />
      <TaskItem task={mockLongTitleTask} isSelected={true} />
      <TaskItem task={mockCompletedTask} isSelected={false} />
    </div>
  ),
};

