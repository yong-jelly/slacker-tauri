import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowUpDown, Calendar, Clock, Type, User } from "lucide-react";
import type { SortType } from "@features/tasks/shared/types";
import { SORT_LABELS } from "@features/tasks/shared/types";

interface SortDropdownProps {
  /** 현재 선택된 정렬 타입 */
  value: SortType;
  /** 정렬 타입 변경 핸들러 */
  onChange: (value: SortType) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

const SORT_ICONS: Record<SortType, typeof Calendar> = {
  created: Calendar,
  remainingTime: Clock,
  title: Type,
  custom: User,
};

export const SortDropdown = ({ value, onChange, disabled }: SortDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (sortType: SortType) => {
    onChange(sortType);
    setIsOpen(false);
  };

  const sortOptions: SortType[] = ["created", "remainingTime", "title", "custom"];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          text-xs font-medium transition-all duration-200
          ${disabled
            ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
            : isOpen
              ? "bg-slate-700 text-slate-200 ring-1 ring-slate-600"
              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/70 hover:text-slate-300"
          }
        `}
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span>{SORT_LABELS[value]}</span>
        <ChevronDown 
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div 
          className="
            absolute top-full right-0 mt-1 z-50
            min-w-[140px] py-1
            bg-slate-800 border border-slate-700 rounded-lg shadow-xl
            animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          {sortOptions.map((sortType) => {
            const Icon = SORT_ICONS[sortType];
            const isSelected = value === sortType;
            
            return (
              <button
                key={sortType}
                onClick={() => handleSelect(sortType)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2
                  text-xs font-medium text-left transition-colors
                  ${isSelected
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-slate-300 hover:bg-slate-700/70 hover:text-slate-200"
                  }
                `}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-slate-500"}`} />
                <span>{SORT_LABELS[sortType]}</span>
                {isSelected && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

