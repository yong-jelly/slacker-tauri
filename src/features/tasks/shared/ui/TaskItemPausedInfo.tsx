import { motion } from "motion/react";
import { formatSecondsReadable, formatRelativeTime } from "../lib/timeFormat";
import { Clock } from "lucide-react";

interface TaskItemPausedInfoProps {
  lastPausedAt?: Date | string;
  remainingTimeSeconds: number;
  expectedDurationMinutes: number;
  delayDays: number;
  tags?: string[];
  isHovered: boolean;
}

/**
 * 일시정지 상태의 태스크 정보 표시 컴포넌트
 * "일시정지 {시간} 전 • 진행 {시간} / 전체 {시간} • n일 지연 [태그]" 형식으로 표시
 */
export const TaskItemPausedInfo = ({
  lastPausedAt,
  remainingTimeSeconds,
  expectedDurationMinutes,
  delayDays,
  tags,
  isHovered,
}: TaskItemPausedInfoProps) => {
  const totalSeconds = expectedDurationMinutes * 60;
  const spentSeconds = Math.max(0, totalSeconds - remainingTimeSeconds);
  
  const spentTimeText = formatSecondsReadable(spentSeconds);
  const totalTimeText = formatSecondsReadable(totalSeconds);
  const isDelayed = delayDays > 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="pl-10 pr-2 -mt-1 text-xs text-gray-500 flex items-center"
    >
      {lastPausedAt && (
        <>
          {/* <span>일시정지 {formatRelativeTime(new Date(lastPausedAt))}</span> */}
          <span>{formatRelativeTime(new Date(lastPausedAt))}</span>
          <span className="mx-1.5 text-gray-600">•</span>
        </>
      )}
      <Clock className="w-3 h-3 text-gray-500 mr-1" />
      <span>진행 {spentTimeText} / 전체 {totalTimeText}</span>
      {/* {isDelayed && (
        <>
          <span className="mx-1.5 text-gray-600">•</span>
          <span className="text-red-400">{delayDays}일 지연</span>
        </>
      )} */}
      
      {/* 태그 표시 (호버 시에만) */}
      {tags && tags.length > 0 && (
        <div className={`flex items-center gap-1 ml-2 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-[10px] text-gray-500">
              +{tags.length - 2}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};


