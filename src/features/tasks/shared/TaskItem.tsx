import { Checkbox } from "@shared/ui";
import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback } from "react";

import { formatDurationWithSpent, formatTargetDate, getDelayDays } from "./lib/timeFormat";
import { useTaskItem } from "./hooks/useTaskItem";
import { useBorderFlash } from "./hooks/useBorderFlash";
import { CircularProgress } from "./ui/CircularProgress";
import { TaskTimerSection } from "./ui/TaskTimerSection";
import { TaskDetailExpanded } from "./ui/TaskDetailExpanded";
import { TaskDetailModal } from "./ui/TaskDetailModal";
import { TaskItemProgressBg } from "./ui/TaskItemProgressBg";
import { TaskItemBorderEffect } from "./ui/TaskItemBorderEffect";
import { TaskItemTitle } from "./ui/TaskItemTitle";
import { TaskItemControls } from "./ui/TaskItemControls";
import { TaskItemPausedInfo } from "./ui/TaskItemPausedInfo";
import { TaskItemUrgencyIcon } from "./ui/TaskItemUrgencyIcon";
import type { TaskItemProps } from "./types";

export type { TaskItemProps };

export const TaskItem = ({
  task,
  isExpanded: isDetailExpanded = false,
  onToggleExpand,
  onOpenDetail: _onOpenDetail,
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
  // 타이틀 편집 상태 (로컬)
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // 커스텀 훅으로 상태 및 핸들러 관리
  const {
    isCompleted,
    isInProgress,
    isPaused,
    isNotStarted,
    isModalOpen,
    modalTab,
    memoInput,
    noteContent,
    tagInput,
    timeExtendMinutes,
    isHovered,
    editingTitle,
    titleInputRef,
    remainingTimeMs,
    remainingTimeSeconds,
    progress,
    completedProgress,
    urgencyLevel,
    urgencyColors,
    sortedHistory,
    sortedTimeExtensions,
    sortedActionHistory,
    latestMemo,
    handleComplete,
    handlePlay,
    handlePause,
    handleAddMemo,
    handleAddNote,
    handleAddTag,
    handleRemoveTag,
    handleToggleImportant,
    handleDelete,
    handlePostponeToTomorrow,
    handlePostponeToToday,
    handleArchive,
    handleExtendTime,
    handleQuickExtendTime,
    handleOpenModal,
    handleCloseModal,
    handleTitleClick,
    handleTitleChange,
    handleTitleKeyDown,
    handleTitleBlur,
    setMemoInput,
    setNoteContent,
    setTagInput,
    setTimeExtendMinutes,
    setModalTab,
    setIsHovered,
  } = useTaskItem({
    task,
    defaultDuration,
    onStatusChange,
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
  });

  // 외곽 라인 플래시 이펙트
  const { showBorderFlash } = useBorderFlash({ isActive: isInProgress });

  // 계산된 값들 - DB 기반 남은 시간으로 소비시간/전체시간 형식 표시
  const expectedDurationText = formatDurationWithSpent(
    task.expectedDuration ?? 5,
    task.remainingTimeSeconds
  );
  const targetDate = task.targetDate ?? new Date();
  const targetDateText = formatTargetDate(targetDate);
  const delayDays = getDelayDays(targetDate);
  const isDelayed = delayDays > 0 && !isCompleted;

  // 로컬 핸들러들
  const handleRowClick = useCallback(() => {
    if (isInProgress) return;
    if (!isDetailExpanded) {
      onToggleExpand?.();
    }
  }, [isDetailExpanded, isInProgress, onToggleExpand]);

  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDetailExpanded) {
      onToggleExpand?.();
    }
  }, [isDetailExpanded, onToggleExpand]);

  const handleStartEditing = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  // 컨테이너 스타일 계산
  const containerClassName = `
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
  `;

  return (
    <motion.div
      layout
      onClick={handleRowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={containerClassName}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* 프로그레스 바 배경 (진행 중일 때만) */}
      {isInProgress && (
        <TaskItemProgressBg progress={progress} bgColor={urgencyColors.bg} />
      )}

      {/* 랜덤 외곽 라인 플래시 이펙트 */}
      <AnimatePresence>
        {isInProgress && showBorderFlash && <TaskItemBorderEffect />}
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
          <TaskItemTitle
            title={task.title}
            isCompleted={isCompleted}
            isInProgress={isInProgress}
            isPaused={isPaused}
            isDetailExpanded={isDetailExpanded}
            isEditingTitle={isEditingTitle}
            editingTitle={editingTitle}
            expectedDurationText={expectedDurationText}
            completedProgress={completedProgress}
            isImportant={task.isImportant}
            isDelayed={isDelayed}
            delayDays={delayDays}
            tags={task.tags}
            isHovered={isHovered}
            titleInputRef={titleInputRef}
            onTitleClick={handleTitleClick}
            onTitleChange={handleTitleChange}
            onTitleKeyDown={(e) => {
              handleTitleKeyDown(e);
              if (e.key === "Enter" || e.key === "Escape") {
                setIsEditingTitle(false);
              }
            }}
            onTitleBlur={() => {
              handleTitleBlur();
              setIsEditingTitle(false);
            }}
            onStartEditing={handleStartEditing}
          />

          {/* 긴급 아이콘 */}
          <AnimatePresence>
            {isInProgress && urgencyLevel !== "normal" && !isDetailExpanded && !isEditingTitle && (
              <TaskItemUrgencyIcon urgencyLevel={urgencyLevel} />
            )}
          </AnimatePresence>

          {/* 컨트롤 버튼 */}
          {!isEditingTitle && (
            <TaskItemControls
              isCompleted={isCompleted}
              isInProgress={isInProgress}
              isPaused={isPaused}
              isDetailExpanded={isDetailExpanded}
              isImportant={task.isImportant}
              onPlay={handlePlay}
              onPause={handlePause}
              onToggleImportant={handleToggleImportant}
              onDelete={handleDelete}
              onOpenModal={handleOpenModal}
            />
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
            <TaskItemPausedInfo
              lastPausedAt={task.lastPausedAt}
              remainingTimeSeconds={remainingTimeSeconds}
              expectedDurationMinutes={task.expectedDuration ?? 5}
              delayDays={delayDays}
              tags={task.tags}
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
              sortedActionHistory={sortedActionHistory}
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
