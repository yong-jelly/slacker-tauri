import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Shared/UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
애니메이션이 있는 원형 체크박스 컴포넌트입니다.

## 특징
- **체크 애니메이션**: 체크 시 스케일 애니메이션으로 부드럽게 나타남
- **커스텀 색상**: 체크 시 배경 색상을 지정 가능 (기본: #F47314)
- **다양한 크기**: sm, md, lg 세 가지 크기 지원
- **접근성**: 네이티브 체크박스 기반으로 키보드 접근성 지원

## 사용 예시
\`\`\`tsx
const [checked, setChecked] = useState(false);

<Checkbox 
  checked={checked} 
  onChange={(e) => setChecked(e.target.checked)} 
/>
\`\`\`
        `,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1E1F22" },
        { name: "card", value: "#2B2D31" },
      ],
    },
  },
  argTypes: {
    checked: {
      control: "boolean",
      description: "체크 상태",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "체크박스 크기",
      table: {
        type: { summary: '"sm" | "md" | "lg"' },
        defaultValue: { summary: "md" },
      },
    },
    checkedColor: {
      control: "color",
      description: "체크 시 배경 색상",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "#F47314" },
      },
    },
    disabled: {
      control: "boolean",
      description: "비활성화 상태",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    onChange: {
      action: "changed",
      description: "체크 상태 변경 이벤트 핸들러",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 체크되지 않은 기본 상태입니다.
 */
export const Unchecked: Story = {
  args: {
    checked: false,
    size: "md",
  },
};

/**
 * 체크된 상태입니다.
 * 오렌지색 배경에 흰색 체크 아이콘이 표시됩니다.
 */
export const Checked: Story = {
  args: {
    checked: true,
    size: "md",
  },
};

/**
 * 인터랙티브 체크박스입니다.
 * 클릭하여 체크 애니메이션을 확인할 수 있습니다.
 */
export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <Checkbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          size="lg"
        />
        <span className="text-gray-400 text-sm">
          클릭하여 애니메이션 확인
        </span>
      </div>
    );
  },
};

/**
 * 다양한 크기의 체크박스를 비교합니다.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Checkbox checked size="sm" />
        <span className="text-gray-500 text-xs">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox checked size="md" />
        <span className="text-gray-500 text-xs">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox checked size="lg" />
        <span className="text-gray-500 text-xs">lg</span>
      </div>
    </div>
  ),
};

/**
 * 커스텀 색상의 체크박스입니다.
 */
export const CustomColors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox checked checkedColor="#F47314" />
      <Checkbox checked checkedColor="#FF6B00" />
      <Checkbox checked checkedColor="#22C55E" />
      <Checkbox checked checkedColor="#3B82F6" />
      <Checkbox checked checkedColor="#8B5CF6" />
    </div>
  ),
};

/**
 * 테스크 아이템에서 사용되는 예시입니다.
 */
export const InTaskItem: Story = {
  render: () => {
    const [tasks, setTasks] = useState([
      { id: 1, title: "피드백 기능 추가", completed: false },
      { id: 2, title: "앱 홍보 이미지 제작", completed: true },
      { id: 3, title: "CSS 레이아웃", completed: true },
    ]);

    const toggleTask = (id: number) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    };

    return (
      <div className="flex flex-col gap-2 w-[300px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-4 py-3 bg-[#2B2D31] rounded-xl"
          >
            <Checkbox
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span
              className={`text-sm ${
                task.completed
                  ? "text-gray-500 line-through"
                  : "text-gray-200"
              }`}
            >
              {task.title}
            </span>
          </div>
        ))}
      </div>
    );
  },
};




