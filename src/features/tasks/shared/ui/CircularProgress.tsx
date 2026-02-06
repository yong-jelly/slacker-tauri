import { motion } from "motion/react";

export interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  bgColor?: string;
  isPaused?: boolean;
  isCompleted?: boolean;
  isNotStarted?: boolean;
}

export const CircularProgress = ({
  progress,
  size = 24,
  strokeWidth = 2.5,
  progressColor = "#FF6B00",
  bgColor = "rgba(107, 114, 128, 0.3)",
  isPaused = false,
  isCompleted = false,
  isNotStarted = false,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  const getProgressColor = () => {
    if (isCompleted) return "#22C55E";
    if (isNotStarted && progress === 0) return "rgba(107, 114, 128, 0.5)";
    return progressColor;
  };

  const actualProgressColor = getProgressColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={actualProgressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </svg>
      {/* {!isNotStarted && progress > 0 && progress < 1 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span
            className="text-[8px] font-bold"
            style={{ color: actualProgressColor }}
          >
            {Math.round(progress * 100)}
          </span>
        </motion.div>
      )} */}
    </div>
  );
};

