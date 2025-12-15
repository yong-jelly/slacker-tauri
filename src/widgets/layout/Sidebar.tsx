import { useState } from "react";
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

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["tasks", "views"])
  );
  const [activeItemId, setActiveItemId] = useState("inbox");

  const categories: MenuCategory[] = [
    {
      id: "tasks",
      label: "Tasks",
      items: [
        {
          id: "inbox",
          label: "할일",
          icon: <Inbox className="w-4 h-4" />,
          count: 6,
        },
        {
          id: "completed",
          label: "완료",
          icon: <CheckCircle2 className="w-4 h-4" />,
          count: 3,
        },
        {
          id: "starred",
          label: "중요",
          icon: <Star className="w-4 h-4" />,
          count: 2,
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
          count: 4,
        },
        {
          id: "tomorrow",
          label: "내일",
          icon: <CalendarDays className="w-4 h-4" />,
          count: 2,
        },
        {
          id: "overdue",
          label: "지연됨",
          icon: <AlertTriangle className="w-4 h-4" />,
          count: 1,
        },
        {
          id: "archive",
          label: "보관함",
          icon: <Archive className="w-4 h-4" />,
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
  ];

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

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveItemId(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
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
