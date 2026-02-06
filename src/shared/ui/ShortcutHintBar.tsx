import { type SidebarMenuId } from "@widgets/layout/Sidebar";

interface ShortcutHintBarProps {
  activeMenuId: SidebarMenuId;
}

export const ShortcutHintBar = ({ activeMenuId }: ShortcutHintBarProps) => {
  // 메뉴별 힌트 구성
  const getHints = () => {
    const commonHints = [
      { keys: "↑↓", label: "이동" },
      { keys: "⌘/", label: "전체" },
    ];

    if (["inbox", "today", "tomorrow"].includes(activeMenuId)) {
      return [
        { keys: "⌘N", label: "추가" },
        { keys: "Enter", label: "시작/정지" },
        { keys: "Space", label: "상세" },
        ...commonHints,
      ];
    }

    if (["completed", "archive"].includes(activeMenuId)) {
      return [
        { keys: "Space", label: "상세" },
        ...commonHints,
      ];
    }

    // Default (starred, overdue, etc.)
    return [
      { keys: "Enter", label: "시작/정지" },
      { keys: "Space", label: "상세" },
      ...commonHints,
    ];
  };

  const hints = getHints();

  return (
    <div className="h-8 flex items-center justify-center border-t border-white/5 bg-[#1E1F22] select-none">
      <div className="flex items-center gap-4">
        {hints.map((hint, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-gray-500 bg-white/5 px-1 rounded">
                {hint.keys}
              </span>
              <span className="text-[11px] text-gray-500">
                {hint.label}
              </span>
            </div>
            {index < hints.length - 1 && (
              <span className="text-[10px] text-gray-700">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
