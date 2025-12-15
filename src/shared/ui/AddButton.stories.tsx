import type { Meta, StoryObj } from "@storybook/react";
import { AddButton } from "./AddButton";

const meta: Meta<typeof AddButton> = {
  title: "Shared/UI/AddButton",
  component: AddButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
새 항목 추가 버튼 컴포넌트입니다.

## 특징
- **기본 상태**: \`+\` 아이콘만 표시 (미니멀한 디자인)
- **호버 상태**: 라벨 텍스트가 슬라이드 애니메이션으로 나타남
- **스타일**: 반투명 배경과 미묘한 테두리로 어두운 테마에 최적화

## 사용 예시
\`\`\`tsx
<AddButton onClick={() => console.log("추가")} />
<AddButton label="새 작업" size="lg" />
\`\`\`
        `,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1E1F22" },
        { name: "sidebar", value: "#2B2D31" },
      ],
    },
  },
  argTypes: {
    label: {
      control: "text",
      description: "호버 시 표시될 텍스트",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "추가하기" },
      },
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "버튼 크기",
      table: {
        type: { summary: '"sm" | "md" | "lg"' },
        defaultValue: { summary: "md" },
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
    onClick: {
      action: "clicked",
      description: "클릭 이벤트 핸들러",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 기본 상태의 AddButton입니다.
 * 마우스를 올리면 "추가하기" 텍스트가 나타납니다.
 */
export const Default: Story = {
  args: {
    label: "추가하기",
    size: "md",
  },
};

/**
 * 작은 크기의 AddButton입니다.
 * 공간이 제한된 영역에 적합합니다.
 */
export const Small: Story = {
  args: {
    label: "추가",
    size: "sm",
  },
};

/**
 * 큰 크기의 AddButton입니다.
 * 주요 액션 버튼으로 사용하기 적합합니다.
 */
export const Large: Story = {
  args: {
    label: "새 작업 추가",
    size: "lg",
  },
};

/**
 * 커스텀 라벨을 가진 AddButton입니다.
 */
export const CustomLabel: Story = {
  args: {
    label: "새 할일",
    size: "md",
  },
};

/**
 * 다양한 크기의 AddButton을 비교합니다.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AddButton label="추가" size="sm" />
      <AddButton label="추가하기" size="md" />
      <AddButton label="새 작업 추가" size="lg" />
    </div>
  ),
};

/**
 * 헤더에서 사용되는 실제 예시입니다.
 */
export const InHeader: Story = {
  render: () => (
    <div
      className="flex items-center justify-between w-[400px] h-12 px-4 border-b border-white/5"
      style={{ backgroundColor: "#1E1F22" }}
    >
      <span className="text-gray-400 text-sm">헤더 영역</span>
      <AddButton label="추가하기" />
    </div>
  ),
};

