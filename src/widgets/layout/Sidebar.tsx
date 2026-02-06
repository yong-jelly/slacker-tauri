import { useState, useMemo } from "react";
import {
  Inbox,
  CheckCircle2,
  Calendar,
  CalendarDays,
  Star,
  Archive,
  Settings,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { type SidebarCounts } from "@shared/hooks";
import { SHORTCUTS } from "@shared/lib/shortcuts";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

export type SidebarMenuId = "inbox" | "completed" | "starred" | "today" | "tomorrow" | "overdue" | "archive" | "settings";

interface SidebarProps {
  isOpen: boolean;
  activeItemId?: SidebarMenuId;
  counts?: SidebarCounts;
  onItemSelect?: (itemId: SidebarMenuId) => void;
}

export const Sidebar = ({ isOpen, activeItemId = "inbox", counts, onItemSelect }: SidebarProps) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["tasks", "views"])
  );

  const categories: MenuCategory[] = useMemo(() => [
    {
      id: "tasks",
      label: "Tasks",
      items: [
        {
          id: "inbox",
          label: "할일",
          icon: <Inbox className="w-4 h-4" />,
          count: counts?.inbox,
        },
        {
          id: "completed",
          label: "완료",
          icon: <CheckCircle2 className="w-4 h-4" />,
          count: counts?.completed,
        },
        {
          id: "starred",
          label: "중요",
          icon: <Star className="w-4 h-4" />,
          count: counts?.starred,
        },
      ],
    },
    {
      id: "views",
      label: "Views",
      items: [
        {
          id: "today",
          label: "오늘",
          icon: <Calendar className="w-4 h-4" />,
          count: counts?.today,
        },
        {
          id: "tomorrow",
          label: "내일",
          icon: <CalendarDays className="w-4 h-4" />,
          count: counts?.tomorrow,
        },
        {
          id: "overdue",
          label: "지연",
          icon: <AlertTriangle className="w-4 h-4" />,
          count: counts?.overdue,
        },
        {
          id: "archive",
          label: "보관",
          icon: <Archive className="w-4 h-4" />,
          count: counts?.archive,
        },
      ],
    },
    {
      id: "general",
      label: "General",
      items: [
        {
          id: "settings",
          label: "설정",
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ], [counts]);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // 메뉴 ID에 해당하는 단축키 찾기
  const getShortcutKey = (menuId: string) => {
    const shortcutId = `nav-${menuId}`;
    const shortcut = SHORTCUTS.find(s => s.id === shortcutId);
    if (!shortcut) return null;
    
    // "⌘+1" -> "⌘1" 형태로 변환
    return shortcut.keys.split(" / ")[0].replace("+", "");
  };

  if (!isOpen) return null;

  return (
    <nav className="py-4 px-3">
      {categories.map((category, categoryIndex) => {
        const isCategoryOpen = openCategories.has(category.id);

        return (
          <div key={category.id} className={categoryIndex > 0 ? "mt-5" : ""}>
            {/* 카테고리 헤더 */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors rounded-md"
            >
              {isCategoryOpen ? (
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              )}
              <span>{category.label}</span>
            </button>

            {/* 카테고리 아이템들 */}
            {isCategoryOpen && (
              <div className="mt-1.5 space-y-1">
                {category.items.map((item) => {
                  const isActive = item.id === activeItemId;
                  const shortcutKey = getShortcutKey(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => onItemSelect?.(item.id as SidebarMenuId)}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                        isActive
                          ? "bg-[#3d5a3d] text-white shadow-sm"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 ${
                          isActive ? "text-green-400" : "text-gray-500"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      
                      {/* 단축키 힌트 */}
                      {shortcutKey && (
                        <span 
                          className={`text-[10px] font-mono transition-opacity ${
                            isActive ? "text-green-300/70" : "text-gray-600 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {shortcutKey}
                        </span>
                      )}

                      {item.count !== undefined && (
                        <span
                          className={`text-[11px] font-normal min-w-[20px] text-center px-1.5 py-0.5 rounded ${
                            isActive
                              ? "text-green-300 bg-green-900/30"
                              : "text-gray-500 bg-white/5"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
