import { useState, useRef, useEffect } from "react";
import { Input, Button } from "@shared/ui";
import { Calendar } from "lucide-react";
import { motion } from "motion/react";

interface AddTaskFormProps {
  /** 등록 버튼 클릭 핸들러 */
  onSubmit: (title: string, targetDate: Date, expectedDuration: number) => void;
  /** 취소 핸들러 */
  onCancel?: () => void;
  /** 자동 포커스 여부 */
  autoFocus?: boolean;
  /** 초기 목표일 (기본값: "today") */
  initialTargetDate?: "today" | "tomorrow";
}

const DURATION_OPTIONS = [
  { label: "5분", value: 5 },
  { label: "10분", value: 10 },
  { label: "30분", value: 30 },
  { label: "1시간", value: 60 },
];

export const AddTaskForm = ({ onSubmit, onCancel, autoFocus = true, initialTargetDate = "today" }: AddTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState<"today" | "tomorrow">(initialTargetDate);
  const [expectedDuration, setExpectedDuration] = useState(30); // 기본값 30분
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // initialTargetDate가 변경되면 targetDate 업데이트
  useEffect(() => {
    setTargetDate(initialTargetDate);
  }, [initialTargetDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const date = new Date();
    if (targetDate === "tomorrow") {
      date.setDate(date.getDate() + 1);
    }
    date.setHours(0, 0, 0, 0);

    onSubmit(title.trim(), date, expectedDuration);
    setTitle("");
    setTargetDate("today");
    setExpectedDuration(30);
  };

  const handleCancel = () => {
    setTitle("");
    setTargetDate("today");
    setExpectedDuration(30);
    onCancel?.();
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="bg-[#2B2D31] rounded-xl p-4 border border-gray-700/50 mb-2"
    >
      <div className="flex flex-col gap-3">
        {/* 타이틀 입력 */}
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일을 입력하세요"
          className="bg-gray-800/50 border-gray-600"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCancel();
            }
          }}
        />

        {/* 옵션들 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 목표일 선택 */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setTargetDate("today")}
              className={`
                px-3 py-1.5 text-xs font-medium transition-colors
                ${targetDate === "today"
                  ? "bg-[#4A5568] text-gray-200"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                }
              `}
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                오늘
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTargetDate("tomorrow")}
              className={`
                px-3 py-1.5 text-xs font-medium transition-colors
                ${targetDate === "tomorrow"
                  ? "bg-[#4A5568] text-gray-200"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                }
              `}
            >
              내일
            </button>
          </div>

          {/* 예상 시간 선택 */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setExpectedDuration(option.value)}
                className={`
                  px-3 py-1.5 text-xs font-medium transition-colors
                  ${expectedDuration === option.value
                    ? "bg-[#4A5568] text-gray-200"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 transition-colors"
            >
              취소
            </button>
            <Button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 text-sm bg-[#4A5568] hover:bg-[#3A4558] text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              등록
            </Button>
          </div>
        </div>
      </div>
    </motion.form>
  );
};

