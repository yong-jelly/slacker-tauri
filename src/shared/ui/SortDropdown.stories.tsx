import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SortDropdown } from "./SortDropdown";
import type { SortType } from "@features/tasks/shared/types";

const meta = {
  title: "Shared/SortDropdown",
  component: SortDropdown,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "태스크 목록의 정렬 기준을 선택하는 드롭다운 컴포넌트입니다. 생성일, 남은시간, 이름순, 사용자(커스텀) 정렬을 지원합니다.",
      },
    },
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#1E2028" }],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "select",
      options: ["created", "remainingTime", "title", "custom"],
      description: "현재 선택된 정렬 타입",
    },
    onChange: {
      action: "changed",
      description: "정렬 타입 변경 시 호출되는 콜백",
    },
    disabled: {
      control: "boolean",
      description: "비활성화 여부",
    },
  },
} satisfies Meta<typeof SortDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 상태 - 생성일 정렬 */
export const Default: Story = {
  args: {
    value: "created",
    disabled: false,
  },
};

/** 남은시간 정렬 선택 */
export const RemainingTime: Story = {
  args: {
    value: "remainingTime",
    disabled: false,
  },
};

/** 이름순 정렬 선택 */
export const Title: Story = {
  args: {
    value: "title",
    disabled: false,
  },
};

/** 사용자 커스텀 정렬 (드래그앤드롭으로 정렬한 경우) */
export const Custom: Story = {
  args: {
    value: "custom",
    disabled: false,
  },
};

/** 비활성화 상태 */
export const Disabled: Story = {
  args: {
    value: "created",
    disabled: true,
  },
};

/** 인터랙티브 예시 - 상태 변경 가능 */
export const Interactive: Story = {
  render: function InteractiveComponent() {
    const [sortType, setSortType] = useState<SortType>("created");
    
    return (
      <div className="flex flex-col items-center gap-4">
        <SortDropdown value={sortType} onChange={setSortType} />
        <div className="text-slate-400 text-sm">
          현재 정렬: <span className="text-amber-400 font-medium">{sortType}</span>
        </div>
      </div>
    );
  },
};

/** 섹션 헤더와 함께 사용하는 예시 */
export const WithSectionHeader: Story = {
  render: function SectionHeaderExample() {
    const [sortType, setSortType] = useState<SortType>("created");
    
    return (
      <div className="w-[400px] bg-[#1E2028] p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-gray-400">할일</h2>
            <span className="text-base font-medium text-gray-500">5</span>
          </div>
          <SortDropdown value={sortType} onChange={setSortType} />
        </div>
        
        {/* Mock task items */}
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="px-4 py-3 bg-slate-800/50 rounded-lg text-slate-300 text-sm"
            >
              태스크 항목 {i}
            </div>
          ))}
        </div>
      </div>
    );
  },
};

