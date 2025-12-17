import { motion } from "motion/react";

interface TaskItemProgressBgProps {
  /** 프로그레스 값 (0~1) */
  progress: number;
  /** 배경 그라데이션 색상 */
  bgColor: string;
}

/**
 * 진행 중인 태스크의 프로그레스 바 배경 컴포넌트
 */
export const TaskItemProgressBg = ({ progress, bgColor }: TaskItemProgressBgProps) => {
  return (
    <motion.div
      className="absolute inset-0 origin-left"
      style={{
        background: `linear-gradient(90deg, ${bgColor} 0%, transparent 100%)`,
      }}
      initial={{ scaleX: 1 }}
      animate={{ scaleX: progress }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
};

