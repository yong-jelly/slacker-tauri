import { motion } from "motion/react";
import { Clock, MoreHorizontal } from "lucide-react";
import { formatTimeMs, formatMinutes } from "../lib/timeFormat";
import type { UrgencyLevel } from "../lib/urgency";

interface TaskTimerSectionProps {
  /** 남은 시간 (밀리초 단위) */
  remainingTimeMs: number;
  progress: number;
  expectedDurationMinutes: number;
  urgencyLevel: UrgencyLevel;
  onQuickExtendTime: (e: React.MouseEvent, minutes: number) => void;
  onOpenTimeModal: (e: React.MouseEvent) => void;
  isHovered?: boolean;
}

export const TaskTimerSection = ({
  remainingTimeMs,
  progress,
  expectedDurationMinutes,
  urgencyLevel,
  onQuickExtendTime,
  onOpenTimeModal,
  isHovered = false,
}: TaskTimerSectionProps) => {
  const expectedDurationText = formatMinutes(expectedDurationMinutes);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-4 mt-2">
        <motion.div
          className={`
            font-mono text-2xl font-bold tracking-wider
            ${urgencyLevel === "critical"
              ? "text-red-500"
              : urgencyLevel === "warning"
                ? "text-yellow-500"
                : "text-[#FF6B00]"
            }
          `}
          animate={
            urgencyLevel === "critical"
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {formatTimeMs(remainingTimeMs)}
        </motion.div>

        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`
              h-full rounded-full
              ${urgencyLevel === "critical"
                ? "bg-gradient-to-r from-red-600 to-red-400"
                : urgencyLevel === "warning"
                  ? "bg-gradient-to-r from-yellow-600 to-yellow-400"
                  : "bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D]"
              }
            `}
            initial={{ width: "100%" }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <motion.span
          className={`
            text-xs font-medium px-2 py-1 rounded-full
            ${urgencyLevel === "critical"
              ? "text-red-500 bg-red-500/10"
              : urgencyLevel === "warning"
                ? "text-yellow-500 bg-yellow-500/10"
                : "text-[#FF6B00] bg-[#FF6B00]/10"
            }
          `}
        >
          {urgencyLevel === "critical"
            ? "집중!"
            : urgencyLevel === "warning"
              ? "진행 중"
              : "시작됨"}
        </motion.span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-gray-500">
          <Clock className="w-3 h-3" />
          <span className="text-xs">예상: {expectedDurationText}</span>
        </div>
        
        {/* 빠른 시간 추가 버튼 */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-[10px] text-gray-500 mr-1">시간 추가:</span>
          {[1, 3, 5].map((min) => (
            <motion.button
              key={min}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => onQuickExtendTime(e, min)}
              className="px-2 py-0.5 text-[10px] rounded bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-gray-200 transition-colors"
            >
              +{min}분
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenTimeModal}
            className="p-1 rounded bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-gray-200 transition-colors"
            title="시간 설정"
          >
            <MoreHorizontal className="w-3 h-3" />
          </motion.button>
        </motion.div>
      </div>

      {/* 파동 애니메이션 */}
      <div className="flex justify-center mt-3">
        <div className="flex items-end gap-0.5 h-[6px]">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <motion.div
              key={i}
              className={`
                w-0.5 rounded-full
                ${urgencyLevel === "critical"
                  ? "bg-red-500"
                  : urgencyLevel === "warning"
                    ? "bg-yellow-500"
                    : "bg-[#FF6B00]"
                }
              `}
              animate={{
                height: ["2px", "6px", "2px"],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

