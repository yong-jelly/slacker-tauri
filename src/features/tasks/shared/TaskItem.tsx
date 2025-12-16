import { TaskStatus, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";
import { Checkbox, Input } from "@shared/ui";
import { 
  Play, Pause, Flame, Zap, Clock, AlertTriangle, Star, Trash2, MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";

import { formatMinutes, formatTargetDate, getDelayDays, formatRelativeTime } from "./lib/timeFormat";
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
  onTitleChange,
}: TaskItemProps) => {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInProgress = task.status === TaskStatus.IN_PROGRESS;
  const isPaused = task.status === TaskStatus.PAUSED;
  const isInbox = task.status === TaskStatus.INBOX;

  // 타이머 훅
  const {
    remainingTimeMs,
    remainingTimeSeconds,
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
    taskTitle: task.title,
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

  // 외곽 라인 이펙트 상태 (랜덤 발생)
  const [showBorderFlash, setShowBorderFlash] = useState(false);

  // 타이틀 편집 상태
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false);

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

  // 타이틀 편집 관련 핸들러
  const handleTitleClick = useCallback((e: React.MouseEvent) => {
    // 타이틀 클릭 시 편집 모드로 진입 (헤더 클릭 이벤트 전파 방지)
    e.stopPropagation();
    if (isDetailExpanded && !isInProgress && !isCompleted) {
      setIsEditingTitle(true);
      setEditingTitle(task.title);
    }
  }, [isDetailExpanded, isInProgress, isCompleted, task.title]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  }, []);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const trimmedTitle = editingTitle.trim();
      isSavingRef.current = true;
      if (trimmedTitle) {
        onTitleChange?.(trimmedTitle);
      } else {
        // 빈 문자열이면 원래 타이틀로 복원
        setEditingTitle(task.title);
      }
      setIsEditingTitle(false);
      // blur 이벤트가 발생하기 전에 플래그를 리셋
      setTimeout(() => {
        isSavingRef.current = false;
      }, 0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setEditingTitle(task.title);
      setIsEditingTitle(false);
    }
  }, [editingTitle, onTitleChange, task.title]);

  const handleTitleBlur = useCallback(() => {
    // Enter 키로 저장한 경우는 blur에서 처리하지 않음
    if (isSavingRef.current) {
      return;
    }
    // 포커스가 다른 곳으로 가면 원래 텍스트로 복원
    setEditingTitle(task.title);
    setIsEditingTitle(false);
  }, [task.title]);

  // 편집 모드일 때 자동 포커스
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // task.title이 변경되면 editingTitle도 동기화
  useEffect(() => {
    if (!isEditingTitle) {
      setEditingTitle(task.title);
    }
  }, [task.title, isEditingTitle]);

  // 진행 중일 때 랜덤한 시간에 외곽 라인 이펙트 발생
  useEffect(() => {
    if (!isInProgress) {
      setShowBorderFlash(false);
      return;
    }

    const triggerFlash = () => {
      setShowBorderFlash(true);
      // 3초 후 이펙트 종료
      setTimeout(() => setShowBorderFlash(false), 3000);
    };

    // 초기 랜덤 딜레이 후 첫 이펙트
    const initialDelay = 2000 + Math.random() * 3000; // 2-5초 사이
    const initialTimer = setTimeout(() => {
      triggerFlash();
    }, initialDelay);

    // 이후 8-15초 사이 랜덤 간격으로 반복 (3초 이펙트 고려)
    const scheduleNextFlash = () => {
      const nextDelay = 8000 + Math.random() * 7000; // 8-15초 사이
      return setTimeout(() => {
        triggerFlash();
        intervalRef.current = scheduleNextFlash();
      }, nextDelay);
    };

    const intervalRef = { current: scheduleNextFlash() };

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(intervalRef.current);
    };
  }, [isInProgress]);

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

      {/* 랜덤 외곽 라인 플래시 이펙트 - 빛이 테두리를 따라 흐르는 효과 */}
      <AnimatePresence>
        {isInProgress && showBorderFlash && (
          <motion.div
            className="absolute -inset-[6px] rounded-[18px] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* 글로우 레이어 - 빛이 흐르는 효과 */}
            <motion.div
              className="absolute inset-0 rounded-[18px]"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, transparent 70%, #ff00ff 78%, #00ffff 82%, #ffff00 86%, #ff0000 90%, transparent 95%, transparent 100%)",
                filter: "blur(8px)",
                opacity: 0.8,
              }}
              initial={{ rotate: -90 }}
              animate={{ rotate: 270 }}
              exit={{ rotate: 270, opacity: 0 }}
              transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
            />
            
            {/* 선명한 외곽선 레이어 */}
            <motion.div
              className="absolute inset-[5px] rounded-xl"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, transparent 65%, #ff00ff 75%, #00ffff 80%, #ffff00 85%, #00ff00 88%, #ff0000 92%, transparent 97%, transparent 100%)",
              }}
              initial={{ rotate: -90 }}
              animate={{ rotate: 270 }}
              exit={{ rotate: 270 }}
              transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
            />
            
            {/* 빛 꼬리 효과 */}
            <motion.div
              className="absolute inset-[4px] rounded-[14px]"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.4) 80%, rgba(255,255,255,0.1) 90%, transparent 95%, transparent 100%)",
                filter: "blur(3px)",
              }}
              initial={{ rotate: -90 }}
              animate={{ rotate: 270 }}
              exit={{ rotate: 270, opacity: 0 }}
              transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
            />
            
            {/* 내부 마스크 - 모든 효과 위에서 내부를 완전히 덮음 */}
            <div 
              className="absolute inset-[6px] rounded-xl bg-[#2B2D31]"
              style={{ 
                boxShadow: "0 0 0 2px #2B2D31",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`
          relative z-10 flex flex-col gap-2 px-5 transition-all
          ${isInProgress ? "py-4" : "py-3"}
        `}
      >
        {/* 상단: 원형 프로그레스 + 제목 + 컨트롤 버튼 */}
        <div 
          className={`flex items-center gap-4 ${isDetailExpanded && !isEditingTitle ? "cursor-pointer" : ""}`}
          onClick={isDetailExpanded && !isEditingTitle ? handleHeaderClick : undefined}
        >
          {/* 원형 프로그레스 인디케이터 / 체크박스 */}
          {!isEditingTitle && (
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
          )}

          {/* 제목 및 기대 시간 */}
          <div 
            className={`flex-1 min-w-0 flex items-center gap-3 ${
              isDetailExpanded && !isEditingTitle ? "pointer-events-none" : ""
            }`}
          >
            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                value={editingTitle}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleBlur}
                className="text-sm font-medium bg-gray-800/50 border-gray-600 px-2 py-1 h-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onClick={handleTitleClick}
                className={`text-sm font-medium truncate pointer-events-auto ${
                  isCompleted ? "line-through text-gray-500" : ""
                } ${
                  isDetailExpanded && !isInProgress && !isCompleted
                    ? "cursor-text underline decoration-gray-500/50 hover:decoration-gray-400/70"
                    : ""
                }`}
              >
                {task.title}
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
            {isInProgress && urgencyLevel !== "normal" && !isDetailExpanded && !isEditingTitle && (
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
          {!isCompleted && !isEditingTitle && (
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
              remainingTimeMs={remainingTimeMs}
              progress={progress}
              expectedDurationMinutes={task.expectedDuration ?? 5}
              urgencyLevel={urgencyLevel}
              onQuickExtendTime={handleQuickExtendTime}
              onOpenTimeModal={(e) => handleOpenModal(e, "time")}
              isHovered={isHovered}
            />
          )}
        </AnimatePresence>

        {/* 일시정지 상태일 때 정보 표시 */}
        <AnimatePresence>
          {isPaused && !isDetailExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="pl-10 pr-2 -mt-2 text-xs text-gray-500"
            >
              {task.lastRunAt && (
                <>
                  <span>{formatRelativeTime(new Date(task.lastRunAt))}</span>
                  <span className="mx-1.5 text-gray-600">•</span>
                </>
              )}
              <span>{Math.ceil(remainingTimeSeconds / 60)}분 남음</span>
            </motion.div>
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
