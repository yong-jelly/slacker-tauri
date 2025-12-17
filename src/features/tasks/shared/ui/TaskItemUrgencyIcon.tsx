import { Flame, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { UrgencyLevel } from "../lib/urgency";

interface TaskItemUrgencyIconProps {
  urgencyLevel: UrgencyLevel;
}

/**
 * 긴급도에 따른 아이콘 표시 컴포넌트
 */
export const TaskItemUrgencyIcon = ({ urgencyLevel }: TaskItemUrgencyIconProps) => {
  if (urgencyLevel === "normal") {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {urgencyLevel === "critical" ? (
        <Flame className="w-5 h-5 text-red-500" />
      ) : (
        <Zap className="w-5 h-5 text-yellow-500" />
      )}
    </motion.div>
  );
};

