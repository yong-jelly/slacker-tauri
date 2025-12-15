import { Plus } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface AddButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 호버 시 표시될 텍스트 */
  label?: string;
  /** 버튼 크기 */
  size?: "sm" | "md" | "lg";
}

/**
 * 새 항목 추가 버튼
 * 
 * 기본 상태에서는 + 아이콘만 표시되고,
 * 마우스 호버 시 라벨 텍스트가 슬라이드 애니메이션으로 나타납니다.
 */
export const AddButton = forwardRef<HTMLButtonElement, AddButtonProps>(
  ({ label = "추가하기", size = "md", className = "", ...props }, ref) => {
    const sizeClasses = {
      sm: {
        button: "px-2 py-1 rounded-md",
        icon: "w-3.5 h-3.5",
        text: "text-xs max-w-[60px]",
      },
      md: {
        button: "px-2.5 py-1.5 rounded-lg",
        icon: "w-4 h-4",
        text: "text-sm max-w-[80px]",
      },
      lg: {
        button: "px-3 py-2 rounded-lg",
        icon: "w-5 h-5",
        text: "text-base max-w-[100px]",
      },
    };

    const sizeConfig = sizeClasses[size];

    return (
      <button
        ref={ref}
        className={`
          group flex items-center gap-0 hover:gap-2
          ${sizeConfig.button}
          bg-white/5 hover:bg-white/10
          border border-white/10 hover:border-white/20
          text-gray-400 hover:text-gray-200
          transition-all duration-200
          ${className}
        `}
        {...props}
      >
        <Plus className={sizeConfig.icon} strokeWidth={2} />
        <span
          className={`
            max-w-0 overflow-hidden group-hover:${sizeConfig.text.split(" ")[1]}
            ${sizeConfig.text.split(" ")[0]}
            transition-all duration-200 font-medium whitespace-nowrap
          `}
        >
          {label}
        </span>
      </button>
    );
  }
);

AddButton.displayName = "AddButton";

