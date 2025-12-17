import { motion } from "motion/react";
import { formatRelativeTime } from "../lib/timeFormat";

interface TaskItemPausedInfoProps {
  lastRunAt?: Date | string;
  remainingTimeSeconds: number;
}

/**
 * 일시정지 상태의 태스크 정보 표시 컴포넌트
 */
export const TaskItemPausedInfo = ({
  lastRunAt,
  remainingTimeSeconds,
}: TaskItemPausedInfoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="pl-10 pr-2 -mt-2 text-xs text-gray-500"
    >
      {lastRunAt && (
        <>
          <span>{formatRelativeTime(new Date(lastRunAt))}</span>
          <span className="mx-1.5 text-gray-600">•</span>
        </>
      )}
      <span>{Math.ceil(remainingTimeSeconds / 60)}분 남음</span>
    </motion.div>
  );
};

