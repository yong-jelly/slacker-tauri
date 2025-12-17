import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { TaskStatus, TaskMemo, TaskNote, TimeExtensionHistory, Task, TaskRunHistory, TaskActionHistory } from "@entities/task";
import { useTaskTimer } from "./useTaskTimer";
import type { UrgencyLevel, UrgencyColors } from "../lib/urgency";
import type { ModalTabType, StatusChangeOptions } from "../types";

export interface UseTaskItemOptions {
  task: Task;
  defaultDuration?: number;
  /** 상태 변경 핸들러 - 일시정지 시 남은 시간도 함께 전달 */
  onStatusChange?: (status: TaskStatus, options?: StatusChangeOptions) => void;
  onAddMemo?: (memo: TaskMemo) => void;
  onAddNote?: (note: TaskNote) => void;
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onToggleImportant?: () => void;
  onDelete?: () => void;
  onTargetDateChange?: (date: Date) => void;
  onArchive?: () => void;
  onExtendTime?: (extension: TimeExtensionHistory) => void;
  onTitleChange?: (title: string) => void;
}

export interface UseTaskItemReturn {
  // 상태 값들
  isCompleted: boolean;
  isInProgress: boolean;
  isPaused: boolean;
  isInbox: boolean;
  isNotStarted: boolean;
  
  // 모달 상태
  isModalOpen: boolean;
  modalTab: ModalTabType;
  
  // 입력 상태
  memoInput: string;
  noteContent: string;
  tagInput: string;
  timeExtendMinutes: number;
  
  // 호버 상태
  isHovered: boolean;
  
  // 타이틀 편집 상태
  isEditingTitle: boolean;
  editingTitle: string;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  
  // 타이머 관련
  remainingTimeMs: number;
  remainingTimeSeconds: number;
  progress: number;
  completedProgress: number;
  urgencyLevel: UrgencyLevel;
  urgencyColors: UrgencyColors;
  
  // 정렬된 히스토리
  sortedHistory: TaskRunHistory[];
  sortedTimeExtensions: TimeExtensionHistory[];
  sortedActionHistory: TaskActionHistory[];
  
  // 최신 메모/노트
  latestMemo: TaskMemo | null;
  latestNote: TaskNote | null;
  
  // 핸들러들
  handleComplete: (e: React.MouseEvent) => void;
  handlePlay: (e: React.MouseEvent) => void;
  handlePause: (e: React.MouseEvent) => void;
  handleAddMemo: (e: React.FormEvent) => void;
  handleAddNote: (e: React.FormEvent) => void;
  handleAddTag: (e: React.FormEvent) => void;
  handleRemoveTag: (e: React.MouseEvent, tag: string) => void;
  handleToggleImportant: (e: React.MouseEvent) => void;
  handleDelete: (e: React.MouseEvent) => void;
  handlePostponeToTomorrow: (e: React.MouseEvent) => void;
  handlePostponeToToday: (e: React.MouseEvent) => void;
  handleArchive: (e: React.MouseEvent) => void;
  handleExtendTime: (e: React.FormEvent) => void;
  handleQuickExtendTime: (e: React.MouseEvent, minutes: number) => void;
  handleOpenModal: (e: React.MouseEvent, tab?: ModalTabType) => void;
  handleCloseModal: (e?: React.MouseEvent) => void;
  handleTitleClick: (e: React.MouseEvent) => void;
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleTitleBlur: () => void;
  
  // 상태 세터들
  setMemoInput: (value: string) => void;
  setNoteContent: (value: string) => void;
  setTagInput: (value: string) => void;
  setTimeExtendMinutes: (value: number) => void;
  setModalTab: (tab: ModalTabType) => void;
  setIsHovered: (value: boolean) => void;
}

export const useTaskItem = ({
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
}: UseTaskItemOptions): UseTaskItemReturn => {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInProgress = task.status === TaskStatus.IN_PROGRESS;
  const isPaused = task.status === TaskStatus.PAUSED;
  const isInbox = task.status === TaskStatus.INBOX;

  console.log("[useTaskItem] task.remainingTimeSeconds:", task.remainingTimeSeconds, "status:", task.status);

  // 타이머 훅 - DB에 저장된 남은 시간이 있으면 사용
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
    savedRemainingTimeSeconds: task.remainingTimeSeconds,
    isInProgress,
    taskTitle: task.title,
    onStatusChange,
    onExtendTime,
  });

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTabType>("memo");

  // 입력 상태
  const [memoInput, setMemoInput] = useState("");
  const latestNote = task.notes?.length ? task.notes[task.notes.length - 1] : null;
  const [noteContent, setNoteContent] = useState(() => latestNote?.content ?? "");
  const [tagInput, setTagInput] = useState("");
  const [timeExtendMinutes, setTimeExtendMinutes] = useState(5);

  // 호버 상태
  const [isHovered, setIsHovered] = useState(false);

  // 타이틀 편집 상태
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false);

  const isNotStarted = isInbox && completedProgress === 0;
  
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

  const sortedActionHistory = useMemo(() => {
    return [...(task.actionHistory || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [task.actionHistory]);

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
      id: latestNote?.id || crypto.randomUUID(),
      title: latestNote?.title || "",
      content: noteContent.trim(),
      createdAt: latestNote?.createdAt || new Date(),
    };
    onAddNote?.(newNote);
  }, [noteContent, onAddNote, latestNote]);

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
    const newDuration = Math.max(1, currentDuration + timeExtendMinutes);
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

  // 타이틀 편집 핸들러
  const handleTitleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

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
        setEditingTitle(task.title);
      }
      setIsEditingTitle(false);
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
    if (isSavingRef.current) {
      return;
    }
    setEditingTitle(task.title);
    setIsEditingTitle(false);
  }, [task.title]);

  // 이펙트들
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isEditingTitle) {
      setEditingTitle(task.title);
    }
  }, [task.title, isEditingTitle]);

  useEffect(() => {
    if (!isModalOpen) {
      const latest = task.notes?.length ? task.notes[task.notes.length - 1] : null;
      setNoteContent(latest?.content ?? "");
    }
  }, [task.notes, isModalOpen]);

  return {
    // 상태 값들
    isCompleted,
    isInProgress,
    isPaused,
    isInbox,
    isNotStarted,
    
    // 모달 상태
    isModalOpen,
    modalTab,
    
    // 입력 상태
    memoInput,
    noteContent,
    tagInput,
    timeExtendMinutes,
    
    // 호버 상태
    isHovered,
    
    // 타이틀 편집 상태
    isEditingTitle,
    editingTitle,
    titleInputRef,
    
    // 타이머 관련
    remainingTimeMs,
    remainingTimeSeconds,
    progress,
    completedProgress,
    urgencyLevel,
    urgencyColors,
    
    // 정렬된 히스토리
    sortedHistory,
    sortedTimeExtensions,
    sortedActionHistory,
    
    // 최신 메모/노트
    latestMemo,
    latestNote,
    
    // 핸들러들
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
    
    // 상태 세터들
    setMemoInput,
    setNoteContent,
    setTagInput,
    setTimeExtendMinutes,
    setModalTab,
    setIsHovered,
  };
};

