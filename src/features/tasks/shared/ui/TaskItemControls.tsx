import { Play, Pause, Star, Trash2, MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";
import type { ModalTabType } from "../types";

interface TaskItemControlsProps {
  isCompleted: boolean;
  isInProgress: boolean;
  isPaused: boolean;
  isDetailExpanded: boolean;
  isImportant?: boolean;
  onPlay: (e: React.MouseEvent) => void;
  onPause: (e: React.MouseEvent) => void;
  onToggleImportant: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onOpenModal: (e: React.MouseEvent, tab?: ModalTabType) => void;
}

/**
 * 태스크 아이템의 컨트롤 버튼 그룹 컴포넌트
 */
export const TaskItemControls = ({
  isCompleted,
  isInProgress,
  isPaused,
  isDetailExpanded,
  isImportant,
  onPlay,
  onPause,
  onToggleImportant,
  onDelete,
  onOpenModal,
}: TaskItemControlsProps) => {
  if (isCompleted) {
    return null;
  }

  // 펼침 상태에서 진행 중이 아닐 때: 중요 표시, 삭제, 더보기 버튼
  if (isDetailExpanded && !isInProgress) {
    return (
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleImportant}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
            isImportant 
              ? "text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30" 
              : "text-gray-500 hover:text-yellow-400 hover:bg-gray-600/30"
          }`}
          title={isImportant ? "중요 표시 해제" : "중요 표시"}
        >
          <Star className={`w-4 h-4 ${isImportant ? "fill-current" : ""}`} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => onOpenModal(e, "memo")}
          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-300 hover:bg-gray-600/20 transition-colors"
          title="더보기"
        >
          <MoreHorizontal className="w-4 h-4" />
        </motion.button>
      </div>
    );
  }

  // 진행 중일 때: 일시정지 버튼
  if (isInProgress) {
    return (
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPause}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30 transition-colors"
        >
          <Pause className="w-4 h-4 text-[#FF6B00]" />
        </motion.button>
      </div>
    );
  }

  // 기본 상태: 마우스 오버 시 '실행' 텍스트 버튼 노출
  return (
    <div className="flex items-center">
      <motion.button
        initial={{ opacity: 0, x: 5 }}
        whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 107, 0, 0.15)" }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPlay}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/20 transition-all group/play"
      >
        {/* <Play className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]/20 group-hover/play:fill-[#FF6B00]" /> */}
        <span className="text-[12px] font-medium text-[#FF6B00]">시작</span>
      </motion.button>
    </div>
  );
};

