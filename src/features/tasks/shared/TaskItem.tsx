import { Checkbox } from "@shared/ui";
import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback, useEffect, useRef } from "react";

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
  
  // 외부 클릭 감지를 위한 ref
  const containerRef = useRef<HTMLDivElement>(null);

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
  const handleRowClick = useCallback((e: React.MouseEvent) => {
    if (isInProgress) return;
    // 외부 클릭 감지와의 충돌 방지를 위해 이벤트 전파 중지
    e.stopPropagation();
    // 항상 토글 (열려있으면 닫고, 닫혀있으면 열기)
    onToggleExpand?.();
  }, [isInProgress, onToggleExpand]);

  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // 헤더 클릭 시 타이틀 편집 모드로 전환
    if (isDetailExpanded && !isEditingTitle && !isInProgress && !isCompleted) {
      handleStartEditing();
    }
  }, [isDetailExpanded, isEditingTitle, isInProgress, isCompleted]);

  const handleCompleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleComplete(e);
  }, [handleComplete]);

  const handleStartEditing = useCallback(() => {
    setIsEditingTitle(true);
    // 상태 업데이트 후 포커스 설정
    // setTimeout을 사용하여 DOM 업데이트가 완전히 완료된 후 실행
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        // 커서를 텍스트 끝으로 이동
        const length = titleInputRef.current.value.length;
        titleInputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isDetailExpanded || isEditingTitle || isModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onToggleExpand?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isDetailExpanded, isEditingTitle, isModalOpen, onToggleExpand]);

  /**
   * 외부 클릭 감지로 TaskItem 닫기
   * 
   * 중요: TaskItem 내부의 input 요소들 간 포커스 이동은 외부 클릭으로 간주하지 않음
   * 예: 타이틀 input에서 태그 input으로 포커스 이동 시 TaskItem이 닫히지 않아야 함
   * 
   * 동작 원리:
   * 1. 포커스 이벤트를 통해 TaskItem 내부의 input 요소로 포커스가 이동하는지 추적
   * 2. 클릭 이벤트에서 다음 조건들을 확인하여 닫지 않음:
   *    - 클릭한 요소가 TaskItem 내부의 input 요소인 경우
   *    - 포커스가 TaskItem 내부의 input 요소로 이동 중인 경우
   *    - 현재 포커스가 TaskItem 내부의 input 요소에 있는 경우
   * 3. 위 조건에 해당하지 않고, TaskItem 외부를 클릭한 경우에만 닫기
   */
  useEffect(() => {
    // 열려있지 않거나, 타이틀 편집 중이거나, 모달이 열려있으면 외부 클릭 감지 비활성화
    if (!isDetailExpanded || isEditingTitle || isModalOpen) return;

    // 포커스가 TaskItem 내부의 input 요소로 이동하는지 추적하는 플래그
    let isFocusingInternalInput = false;

    /**
     * 포커스 이벤트 핸들러
     * TaskItem 내부의 input 요소로 포커스가 이동하는지 확인
     */
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // 포커스가 TaskItem 내부의 입력 가능한 요소(input, textarea, select, contentEditable)로 이동하는 경우
      if (
        containerRef.current &&
        containerRef.current.contains(target) &&
        (target.tagName === "INPUT" || 
         target.tagName === "TEXTAREA" || 
         target.tagName === "SELECT" ||
         target.isContentEditable)
      ) {
        // 플래그 설정: input 간 포커스 이동 중임을 표시
        isFocusingInternalInput = true;
        // 짧은 시간 후 플래그 리셋 (다음 클릭 이벤트를 위해)
        // 포커스 이벤트가 클릭 이벤트보다 먼저 발생하므로, 클릭 이벤트에서 이 플래그를 확인할 수 있음
        setTimeout(() => {
          isFocusingInternalInput = false;
        }, 100);
      }
    };

    /**
     * 클릭 이벤트 핸들러
     * 외부 클릭인지 확인하고, 외부 클릭인 경우에만 TaskItem 닫기
     */
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedElement = e.target as HTMLElement;

      // 조건 1: 클릭한 요소가 TaskItem 내부의 입력 가능한 요소인 경우 무시
      // 예: 태그 input을 클릭하거나, 메모 input을 클릭한 경우
      if (
        containerRef.current &&
        containerRef.current.contains(target) &&
        (clickedElement.tagName === "INPUT" || 
         clickedElement.tagName === "TEXTAREA" || 
         clickedElement.tagName === "SELECT" ||
         clickedElement.isContentEditable)
      ) {
        return;
      }

      // 조건 2: 포커스가 TaskItem 내부의 input 요소로 이동 중인 경우 무시
      // 예: 타이틀 input에서 태그 input으로 포커스 이동 중인 경우
      if (isFocusingInternalInput) {
        return;
      }

      // 조건 3: 현재 포커스가 TaskItem 내부의 input 요소에 있는 경우 무시
      // 예: 태그 input에 포커스가 있는 상태에서 다른 곳을 클릭한 경우
      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement &&
        containerRef.current &&
        containerRef.current.contains(activeElement) &&
        (activeElement.tagName === "INPUT" || 
         activeElement.tagName === "TEXTAREA" || 
         activeElement.tagName === "SELECT" ||
         activeElement.isContentEditable)
      ) {
        return;
      }

      // 위 조건들에 해당하지 않고, TaskItem 외부를 클릭한 경우에만 닫기
      // 모달이 열려있는 경우는 제외 (모달 내부 클릭은 외부 클릭으로 간주하지 않음)
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(target as Element).closest('[role="dialog"]')
      ) {
        onToggleExpand?.();
      }
    };

    // 포커스 이벤트 리스너 추가 (캡처 단계에서 먼저 처리하여 클릭 이벤트보다 먼저 실행)
    document.addEventListener("focus", handleFocus, true);
    // 클릭 이벤트 리스너 추가 (버블링 단계에서 처리하여 TaskItem 내부 클릭이 먼저 처리되도록 함)
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDetailExpanded, isEditingTitle, isModalOpen, onToggleExpand]);

  // 닫힐 때 모든 입력 상태 초기화
  useEffect(() => {
    if (!isDetailExpanded) {
      // 타이틀 편집 상태 취소
      setIsEditingTitle(false);
      // 메모 입력 초기화
      setMemoInput("");
      // 태그 입력 초기화
      setTagInput("");
    }
  }, [isDetailExpanded, setMemoInput, setTagInput]);

  // 타이틀 편집 모드로 전환 시 포커스 및 커서 위치 설정
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      // 렌더링 완료 후 포커스 및 커서 위치 설정
      // requestAnimationFrame을 두 번 사용하여 DOM 업데이트가 완전히 완료된 후 실행
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (titleInputRef.current) {
            titleInputRef.current.focus();
            // 커서를 텍스트 끝으로 이동
            const length = titleInputRef.current.value.length;
            titleInputRef.current.setSelectionRange(length, length);
          }
        });
      });
    }
  }, [isEditingTitle]);

  // 컨테이너 스타일 계산
  const containerClassName = `
    group relative overflow-hidden transition-colors rounded-xl ${isInProgress ? "cursor-default" : "cursor-pointer"}
    ${isDetailExpanded
      ? "bg-bg-tertiary text-gray-100 ring-2 ring-gray-500/70 shadow-lg shadow-gray-900/50"
      : isInProgress
        ? "bg-bg-sidebar text-gray-200 hover:bg-bg-sidebar/90"
        : isDelayed
          ? "bg-bg-sidebar text-gray-200 border-l-2 border-red-500/50 hover:bg-bg-sidebar/80"
          : isPaused
            ? "bg-bg-sidebar text-gray-200 border-l-2 border-yellow-500/50 hover:bg-bg-sidebar/80"
            : "bg-bg-sidebar text-gray-200 hover:bg-bg-sidebar/80"
    }
  `;

  return (
    <motion.div
      ref={containerRef}
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
            <div className="flex-shrink-0" onClick={handleCompleteClick}>
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
