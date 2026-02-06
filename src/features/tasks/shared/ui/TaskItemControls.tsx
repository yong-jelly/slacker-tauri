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

  // 기본 상태: 재생 버튼 제거 (단축키 Space로 대체)
  return null;
};

