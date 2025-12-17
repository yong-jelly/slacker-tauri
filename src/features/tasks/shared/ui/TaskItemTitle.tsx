import { Input } from "@shared/ui";
import { Clock, Star, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface TaskItemTitleProps {
  title: string;
  isCompleted: boolean;
  isInProgress: boolean;
  isPaused: boolean;
  isDetailExpanded: boolean;
  isEditingTitle: boolean;
  editingTitle: string;
  expectedDurationText: string;
  completedProgress: number;
  isImportant?: boolean;
  isDelayed: boolean;
  delayDays: number;
  tags?: string[];
  isHovered: boolean;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  onTitleClick: (e: React.MouseEvent) => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTitleBlur: () => void;
  onStartEditing: () => void;
}

/**
 * 태스크 제목 영역 컴포넌트 (편집 기능 포함)
 */
export const TaskItemTitle = ({
  title,
  isCompleted,
  isInProgress,
  isPaused,
  isDetailExpanded,
  isEditingTitle,
  editingTitle,
  expectedDurationText,
  completedProgress,
  isImportant,
  isDelayed,
  delayDays,
  tags,
  isHovered,
  titleInputRef,
  onTitleClick,
  onTitleChange,
  onTitleKeyDown,
  onTitleBlur,
  onStartEditing,
}: TaskItemTitleProps) => {
  const handleTitleSpanClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDetailExpanded && !isInProgress && !isCompleted) {
      onStartEditing();
    }
  };

  return (
    <div 
      className={`flex-1 min-w-0 flex items-center gap-3 ${
        isDetailExpanded && !isEditingTitle ? "pointer-events-none" : ""
      }`}
    >
      {isEditingTitle ? (
        <Input
          ref={titleInputRef}
          value={editingTitle}
          onChange={onTitleChange}
          onKeyDown={onTitleKeyDown}
          onBlur={onTitleBlur}
          className="text-sm font-medium bg-gray-800/50 border-gray-600 px-2 py-1 h-auto pointer-events-auto"
          onClick={onTitleClick}
        />
      ) : (
        <span
          onClick={handleTitleSpanClick}
          className={`text-sm font-medium truncate pointer-events-auto ${
            isCompleted ? "line-through text-gray-500" : ""
          } ${
            isDetailExpanded && !isInProgress && !isCompleted
              ? "cursor-text underline decoration-gray-500/50 hover:decoration-gray-400/70"
              : ""
          }`}
        >
          {title}
        </span>
      )}

      {/* 펼침 상태일 때 중앙에 예상시간 표시 */}
      {isDetailExpanded && !isInProgress && !isEditingTitle && (
        <div className="flex items-center gap-1.5 flex-shrink-0 pointer-events-auto">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-400">
            {expectedDurationText}
          </span>
        </div>
      )}

      {/* 기대 작업 시간 및 태그 (축소 상태에서만 표시) */}
      {!isInProgress && !isCompleted && !isDetailExpanded && (
        <motion.div
          className="flex items-center gap-1.5 flex-wrap flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] text-gray-500">
            {expectedDurationText}
          </span> */}
          
          {/* 중요 표시 별 아이콘 */}
          {isImportant && (
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          )}
          
          {!isPaused && completedProgress > 0 && (
            <span className="text-[10px] ml-0.5 text-[#FF6B00]">
              • {Math.round(completedProgress * 100)}%
            </span>
          )}
          
          {isDelayed && (
            <span className="flex items-center gap-0.5 text-[10px] ml-0.5 text-red-400">
              <AlertTriangle className="w-2.5 h-2.5" />
              {delayDays}일 지연
            </span>
          )}
          
          {/* 태그 표시 (호버 시에만) */}
          {/* {tags && tags.length > 0 && (
            <div className={`flex items-center gap-1 ml-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
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
          )} */}
        </motion.div>
      )}
    </div>
  );
};

