import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, X, Minimize2, Maximize2, Settings } from "lucide-react";
import { Task } from "@entities/task";
import { formatTimeMs, formatMinutes } from "@features/tasks/shared/lib/timeFormat";
import { useTaskTimer } from "@features/tasks/shared/hooks/useTaskTimer";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { PhysicalSize } from "@tauri-apps/api/dpi";
import { loadWidgetSettings, saveWidgetMinimized, saveWidgetOpacity, saveWidgetPosition } from "@shared/lib/widgetStorage";

interface TaskWidgetProps {
  task: Task;
}

export const TaskWidget = ({ task }: TaskWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // 설정 불러오기
  useEffect(() => {
    const settings = loadWidgetSettings();
    setIsMinimized(settings.isMinimized);
    setOpacity(settings.opacity);
  }, []);

  const {
    remainingTimeMs,
    progress,
    urgencyLevel,
  } = useTaskTimer({
    expectedDuration: task.expectedDuration ?? 5,
    isInProgress: task.status === TaskStatus.IN_PROGRESS,
    taskTitle: task.title,
  });

  const handleClose = async () => {
    const window = getCurrentWebviewWindow();
    await window.close();
  };

  const handleToggleMinimize = async () => {
    const newIsMinimized = !isMinimized;
    setIsMinimized(newIsMinimized);
    saveWidgetMinimized(newIsMinimized);
    
    // 위젯 창 크기 조절
    const window = getCurrentWebviewWindow();
    if (newIsMinimized) {
      await window.setSize(new PhysicalSize(160, 50));
    } else {
      await window.setSize(new PhysicalSize(320, 140));
    }
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    saveWidgetOpacity(newOpacity);
  };

  // 드래그 종료 시 위치 저장
  const handleDragEnd = async () => {
    try {
      const window = getCurrentWebviewWindow();
      const position = await window.outerPosition();
      saveWidgetPosition(position.x, position.y);
    } catch (error) {
      console.error("Failed to save widget position:", error);
    }
  };

  const urgencyColors = {
    critical: {
      text: "text-red-500",
      bg: "bg-red-500/20",
      border: "border-red-500/50",
      progress: "bg-gradient-to-r from-red-600 to-red-400",
    },
    warning: {
      text: "text-yellow-500",
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/50",
      progress: "bg-gradient-to-r from-yellow-600 to-yellow-400",
    },
    normal: {
      text: "text-[#FF6B00]",
      bg: "bg-[#FF6B00]/20",
      border: "border-[#FF6B00]/50",
      progress: "bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D]",
    },
  };

  const colors = urgencyColors[urgencyLevel];

  // 미니 모드
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: opacity, scale: 1 }}
        data-tauri-drag-region
        onMouseUp={handleDragEnd}
        className={`
          relative w-full h-full rounded-lg
          ${colors.border} border-2
          shadow-xl px-3 py-2 flex items-center gap-2 cursor-move
          bg-[#1C1E22]
        `}
        style={{ opacity }}
      >
        <motion.div
          className={`font-mono text-lg font-bold tracking-wider ${colors.text}`}
          animate={urgencyLevel === "critical" ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {formatTimeMs(remainingTimeMs)}
        </motion.div>
        
        <button
          onClick={handleToggleMinimize}
          onMouseDown={(e) => e.stopPropagation()}
          className="ml-auto p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        
        <button
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: opacity, scale: 1 }}
      data-tauri-drag-region
      onMouseUp={handleDragEnd}
      className={`
        relative w-full h-full rounded-xl
        ${colors.border} border-2
        shadow-2xl p-4 flex flex-col gap-2 cursor-move
        bg-[#1C1E22]
      `}
      style={{ opacity }}
    >
      {/* 상단 버튼들 */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button
          onClick={() => setShowSettings(!showSettings)}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <Settings className="w-3 h-3" />
        </button>
        <button
          onClick={handleToggleMinimize}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* 설정 패널 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-10 right-2 bg-[#2B2D31] rounded-lg p-3 shadow-xl z-20"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-gray-400 mb-2">투명도</div>
            <input
              type="range"
              min="30"
              max="100"
              value={opacity * 100}
              onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
              className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">{Math.round(opacity * 100)}%</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task 제목 */}
      <div className="pr-24">
        <h3 className="text-sm font-semibold text-white truncate">
          {task.title}
        </h3>
      </div>

      {/* 타이머 */}
      <div className="flex items-center gap-3">
        <motion.div
          className={`font-mono text-2xl font-bold tracking-wider ${colors.text}`}
          animate={
            urgencyLevel === "critical"
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {formatTimeMs(remainingTimeMs)}
        </motion.div>

        <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${colors.progress}`}
            initial={{ width: "100%" }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* 예상 시간 */}
      <div className="flex items-center gap-1 text-gray-400 text-xs">
        <Clock className="w-3 h-3" />
        <span>예상: {formatMinutes(task.expectedDuration ?? 5)}</span>
      </div>

      {/* 글로우 효과 */}
      {urgencyLevel === "critical" && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 0px ${colors.text}`,
              `0 0 20px ${colors.text}`,
              `0 0 0px ${colors.text}`,
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

