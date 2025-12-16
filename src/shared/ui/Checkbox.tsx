import { Check } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** 체크 상태 */
  checked?: boolean;
  /** 체크박스 크기 */
  size?: "sm" | "md" | "lg";
  /** 체크 시 배경 색상 */
  checkedColor?: string;
}

/**
 * 애니메이션이 있는 체크박스 컴포넌트
 * 
 * 체크 시 배경색이 변하고 체크 아이콘이 스케일 애니메이션으로 나타납니다.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked = false,
      size = "md",
      checkedColor = "#F47314",
      className = "",
      onChange,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: {
        box: "w-4 h-4",
        icon: "w-2.5 h-2.5",
        border: "border-[1.5px]",
      },
      md: {
        box: "w-5 h-5",
        icon: "w-3 h-3",
        border: "border-2",
      },
      lg: {
        box: "w-6 h-6",
        icon: "w-4 h-4",
        border: "border-2",
      },
    };

    const sizeConfig = sizeClasses[size];

    return (
      <label className={`relative inline-flex cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`
            ${sizeConfig.box}
            ${sizeConfig.border}
            rounded-full
            flex items-center justify-center
            transition-all duration-200 ease-out
            ${checked 
              ? "border-transparent" 
              : "border-gray-500 hover:border-gray-400 bg-transparent"
            }
          `}
          style={{
            backgroundColor: checked ? checkedColor : "transparent",
          }}
        >
          <Check
            className={`
              ${sizeConfig.icon}
              text-white
              transition-all duration-200 ease-out
              ${checked 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-50"
              }
            `}
            strokeWidth={3}
          />
        </div>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";



