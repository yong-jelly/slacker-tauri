import { TaskStatus, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";
import { Checkbox } from "@shared/ui";
import { 
  Play, Pause, Flame, Zap, Clock, AlertTriangle, Star, Trash2, MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback, useMemo } from "react";

import { formatMinutes, formatTargetDate, getDelayDays } from "./lib/timeFormat";
import { useTaskTimer } from "./hooks/useTaskTimer";
import { CircularProgress } from "./ui/CircularProgress";
import { TaskTimerSection } from "./ui/TaskTimerSection";
import { TaskDetailExpanded } from "./ui/TaskDetailExpanded";
import { TaskDetailModal } from "./ui/TaskDetailModal";
import type { TaskItemProps, ModalTabType } from "./types";

export type { TaskItemProps };

export const TaskItem = ({
  task,
  onOpenDetail,
  onStatusChange,
  defaultDuration,
  onAddMemo,
  onAddNote,
  onAddTag,
  onRemoveTag,
  onToggleImportant,
  onDelete,
  onTargetDateChange,
  onArchive,
  onExtendTime,
}: TaskItemProps) => {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInProgress = task.status === TaskStatus.IN_PROGRESS;
  const isPaused = task.status === TaskStatus.PAUSED;
  const isInbox = task.status === TaskStatus.INBOX;

  // 타이머 훅
  const {
    remainingTime,
    progress,
    completedProgress,
    urgencyLevel,
    urgencyColors,
    handlePlay,
    handlePause,
    handleQuickExtendTime,
    extendRemainingTime,
  } = useTaskTimer({
    expectedDuration: task.expectedDuration ?? 5,
    defaultDuration,
    isInProgress,
    onStatusChange,
    onExtendTime,
  });

  // 상세 정보 확장 상태
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  
  // 더보기 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTabType>("memo");

  // 메모 입력 상태
  const [memoInput, setMemoInput] = useState("");

  // 노트 입력 상태
  const [noteContent, setNoteContent] = useState("");

  // 태그 입력 상태
  const [tagInput, setTagInput] = useState("");

  // 시간 추가 상태
  const [timeExtendMinutes, setTimeExtendMinutes] = useState(5);

  // 호버 상태
  const [isHovered, setIsHovered] = useState(false);

  const isNotStarted = isInbox && completedProgress === 0;
  const expectedDurationText = formatMinutes(task.expectedDuration ?? 5);

  // 목표일 관련
  const targetDate = task.targetDate ?? new Date();
  const targetDateText = formatTargetDate(targetDate);
  const delayDays = getDelayDays(targetDate);
  const isDelayed = delayDays > 0 && !isCompleted;

  // 최신 메모
  const latestMemo = task.memos?.length ? task.memos[task.memos.length - 1] : null;
  
  // 정렬된 히스토리
  const sortedHistory = useMemo(() => {
    return [...(task.runHistory || [])].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [task.runHistory]);

  const sortedTimeExtensions = useMemo(() => {
    return [...(task.timeExtensions || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [task.timeExtensions]);

  // 핸들러들
  const handleComplete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCompleted) {
        onStatusChange?.(TaskStatus.INBOX);
      } else {
        onStatusChange?.(TaskStatus.COMPLETED);
      }
    },
    [onStatusChange, isCompleted]
  );

  const handleRowClick = useCallback(() => {
    if (isInProgress) return;
    if (!isDetailExpanded) {
      setIsDetailExpanded(true);
    }
  }, [isDetailExpanded, isInProgress]);

  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDetailExpanded) {
      setIsDetailExpanded(false);
    }
  }, [isDetailExpanded]);

  const handleAddMemo = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!memoInput.trim()) return;
    
    const newMemo: TaskMemo = {
      id: crypto.randomUUID(),
      content: memoInput.trim(),
      createdAt: new Date(),
    };
    onAddMemo?.(newMemo);
    setMemoInput("");
  }, [memoInput, onAddMemo]);

  const handleAddNote = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!noteContent.trim()) return;
    
    const newNote: TaskNote = {
      id: crypto.randomUUID(),
      title: "",
      content: noteContent.trim(),
      createdAt: new Date(),
    };
    onAddNote?.(newNote);
    setNoteContent("");
  }, [noteContent, onAddNote]);

  const handleOpenModal = useCallback((e: React.MouseEvent, tab: ModalTabType = "memo") => {
    e.stopPropagation();
    setModalTab(tab);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsModalOpen(false);
  }, []);

  const handleExtendTime = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (timeExtendMinutes === 0) return;
    
    const currentDuration = task.expectedDuration ?? 5;
    const newDuration = Math.max(1, currentDuration + timeExtendMinutes); // 최소 1분 보장
    const extension: TimeExtensionHistory = {
      id: crypto.randomUUID(),
      addedMinutes: timeExtendMinutes,
      previousDuration: currentDuration,
      newDuration: newDuration,
      createdAt: new Date(),
    };
    onExtendTime?.(extension);
    extendRemainingTime(timeExtendMinutes);
    setTimeExtendMinutes(5);
  }, [timeExtendMinutes, task.expectedDuration, onExtendTime, extendRemainingTime]);

  const handleAddTag = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tagInput.trim()) return;
    
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag) {
      onAddTag?.(tag);
    }
    setTagInput("");
  }, [tagInput, onAddTag]);

  const handleRemoveTag = useCallback((e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onRemoveTag?.(tag);
  }, [onRemoveTag]);

  const handleToggleImportant = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleImportant?.();
  }, [onToggleImportant]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  }, [onDelete]);

  const handlePostponeToTomorrow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    onTargetDateChange?.(tomorrow);
  }, [onTargetDateChange]);

  const handlePostponeToToday = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onTargetDateChange?.(today);
  }, [onTargetDateChange]);

  const handleArchive = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.();
  }, [onArchive]);

  return (
    <motion.div
      layout
      onClick={handleRowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative overflow-hidden transition-colors rounded-xl ${isInProgress ? "cursor-default" : "cursor-pointer"}
        ${isDetailExpanded
          ? "bg-[#232528] text-gray-100 ring-2 ring-gray-500/70 shadow-lg shadow-gray-900/50"
          : isInProgress
            ? "bg-[#2B2D31] text-gray-200 hover:bg-[#2A2C30]"
            : isDelayed
              ? "bg-[#2B2D31] text-gray-200 border-l-2 border-red-500/50 hover:bg-[#32343A]"
              : isPaused
                ? "bg-[#2B2D31] text-gray-200 border-l-2 border-yellow-500/50 hover:bg-[#32343A]"
                : "bg-[#2B2D31] text-gray-200 hover:bg-[#32343A]"
        }
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* 프로그레스 바 배경 (진행 중일 때만) */}
      {isInProgress && (
        <motion.div
          className="absolute inset-0 origin-left"
          style={{
            background: `linear-gradient(90deg, ${urgencyColors.bg} 0%, transparent 100%)`,
          }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}

      {/* 진행 중 외곽 파동 효과 */}
      <AnimatePresence>
        {isInProgress && (
          <>
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ borderColor: urgencyColors.border }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.6, 0],
                scale: [1, 1.02],
                boxShadow: [
                  `0 0 0px ${urgencyColors.glow}`,
                  `0 0 12px ${urgencyColors.glow}`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ borderColor: urgencyColors.border }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.4, 0],
                scale: [1, 1.03],
                boxShadow: [
                  `0 0 0px ${urgencyColors.glow}`,
                  `0 0 16px ${urgencyColors.glow}`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute inset-0 rounded-xl border"
              style={{ borderColor: `${urgencyColors.border}40` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </>
        )}
      </AnimatePresence>

      <div
        className={`
          relative z-10 flex flex-col gap-2 px-5 transition-all
          ${isInProgress ? "py-4" : "py-3"}
        `}
      >
        {/* 상단: 원형 프로그레스 + 제목 + 컨트롤 버튼 */}
        <div className="flex items-center gap-4" onClick={isDetailExpanded ? handleHeaderClick : undefined}>
          {/* 원형 프로그레스 인디케이터 / 체크박스 */}
          <div className="flex-shrink-0" onClick={handleComplete}>
            {isCompleted ? (
              <Checkbox
                checked={true}
                checkedColor="#22C55E"
                size="md"
                onChange={() => {}}
              />
            ) : (
              <CircularProgress
                progress={completedProgress}
                size={24}
                strokeWidth={2.5}
                progressColor={urgencyColors.progress}
                isPaused={isPaused}
                isNotStarted={isNotStarted}
              />
            )}
          </div>

          {/* 제목 및 기대 시간 */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <span
              className={`text-sm font-medium truncate ${isCompleted ? "line-through text-gray-500" : ""}`}
            >
              {task.title}
            </span>
            {/* 펼침 상태일 때 중앙에 예상시간 표시 */}
            {isDetailExpanded && !isInProgress && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
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
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-[10px] text-gray-500">
                  {expectedDurationText}
                </span>
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
                {task.tags && task.tags.length > 0 && (
                  <div className={`flex items-center gap-1 ml-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                    {task.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="text-[10px] text-gray-500">
                        +{task.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* 긴급 아이콘 */}
          <AnimatePresence>
            {isInProgress && urgencyLevel !== "normal" && !isDetailExpanded && (
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
            )}
          </AnimatePresence>

          {/* 컨트롤 버튼 */}
          {!isCompleted && (
            <div className="flex items-center gap-2">
              {isDetailExpanded && !isInProgress ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleImportant}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                      task.isImportant 
                        ? "text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30" 
                        : "text-gray-500 hover:text-yellow-400 hover:bg-gray-600/30"
                    }`}
                    title={task.isImportant ? "중요 표시 해제" : "중요 표시"}
                  >
                    <Star className={`w-4 h-4 ${task.isImportant ? "fill-current" : ""}`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDelete}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleOpenModal(e, "memo")}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-300 hover:bg-gray-600/20 transition-colors"
                    title="더보기"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </motion.button>
                </>
              ) : isInProgress ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePause}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30 transition-colors"
                >
                  <Pause className="w-4 h-4 text-[#FF6B00]" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlay}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full transition-colors
                    ${isPaused
                      ? "bg-yellow-500/20 hover:bg-yellow-500/30"
                      : "bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30"
                    }
                  `}
                >
                  <Play
                    className={`w-4 h-4 ${isPaused ? "text-yellow-500" : "text-[#FF6B00]"}`}
                  />
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* 진행 중일 때 타이머 확장 */}
        <AnimatePresence>
          {isInProgress && (
            <TaskTimerSection
              remainingTime={remainingTime}
              progress={progress}
              expectedDurationMinutes={task.expectedDuration ?? 5}
              urgencyLevel={urgencyLevel}
              onQuickExtendTime={handleQuickExtendTime}
              onOpenTimeModal={(e) => handleOpenModal(e, "time")}
              isHovered={isHovered}
            />
          )}
        </AnimatePresence>

        {/* 상세 정보 확장 (클릭 시) */}
        <AnimatePresence>
          {isDetailExpanded && !isInProgress && (
            <TaskDetailExpanded
              task={task}
              targetDateText={targetDateText}
              delayDays={delayDays}
              isDelayed={isDelayed}
              expectedDurationText={expectedDurationText}
              latestMemo={latestMemo}
              memoInput={memoInput}
              tagInput={tagInput}
              onMemoInputChange={setMemoInput}
              onTagInputChange={setTagInput}
              onAddMemo={handleAddMemo}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onPostponeToTomorrow={handlePostponeToTomorrow}
              onPostponeToToday={handlePostponeToToday}
              onArchive={handleArchive}
              onOpenModal={handleOpenModal}
            />
          )}
        </AnimatePresence>

        {/* 더보기 모달 */}
        <AnimatePresence>
          {isModalOpen && (
            <TaskDetailModal
              task={task}
              isOpen={isModalOpen}
              activeTab={modalTab}
              sortedHistory={sortedHistory}
              sortedTimeExtensions={sortedTimeExtensions}
              expectedDurationText={expectedDurationText}
              memoInput={memoInput}
              noteContent={noteContent}
              timeExtendMinutes={timeExtendMinutes}
              onClose={handleCloseModal}
              onTabChange={setModalTab}
              onMemoInputChange={setMemoInput}
              onNoteContentChange={setNoteContent}
              onTimeExtendMinutesChange={setTimeExtendMinutes}
              onAddMemo={handleAddMemo}
              onAddNote={handleAddNote}
              onExtendTime={handleExtendTime}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
