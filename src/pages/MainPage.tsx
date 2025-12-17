import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Task, TaskStatus, TaskPriority, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";
import { TaskSection, AppLayout } from "@widgets/index";
import { openTaskWindow } from "@shared/lib/openTaskWindow";
import { requestNotificationPermission, sendTaskCompletedNotification } from "@shared/lib/notification";
import { useTasks, useSidebarCounts } from "@shared/hooks";
import { type SidebarMenuId } from "@widgets/layout/Sidebar";
import type { StatusChangeOptions, SortType } from "@features/tasks/shared/types";

// 오늘/내일 날짜 비교용 헬퍼
const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

const isBeforeDay = (date: Date, reference: Date) => {
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return d1 < d2;
};

// 메뉴별 태스크 필터 함수
const filterTasksByMenu = (tasks: Task[], menuId: SidebarMenuId): Task[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (menuId) {
    case "inbox":
      return tasks.filter((t) => t.status === TaskStatus.INBOX);
    case "completed":
      return tasks.filter((t) => t.status === TaskStatus.COMPLETED);
    case "starred":
      return tasks.filter((t) => t.isImportant && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.ARCHIVED);
    case "today":
      return tasks.filter((t) => {
        if (!t.targetDate || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.ARCHIVED) return false;
        return isSameDay(new Date(t.targetDate), today);
      });
    case "tomorrow":
      return tasks.filter((t) => {
        if (!t.targetDate || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.ARCHIVED) return false;
        return isSameDay(new Date(t.targetDate), tomorrow);
      });
    case "overdue":
      return tasks.filter((t) => {
        if (!t.targetDate || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.ARCHIVED) return false;
        return isBeforeDay(new Date(t.targetDate), today);
      });
    case "archive":
      return tasks.filter((t) => t.status === TaskStatus.ARCHIVED);
    default:
      return tasks;
  }
};

export const MainPage = () => {
  const navigate = useNavigate();
  const {
    tasks,
    loading,
    error,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    addMemo,
    addNote,
    updateNote,
    addTag,
    removeTag,
    extendTime,
  } = useTasks();

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 각 섹션별 정렬 상태 관리 (진행중 섹션은 정렬 없음)
  const [pausedSortType, setPausedSortType] = useState<SortType>("created");
  const [inboxSortType, setInboxSortType] = useState<SortType>("created");
  const [filteredSortType, setFilteredSortType] = useState<SortType>("created");

  // 사용자 정의 순서 (드래그앤드롭으로 정렬된 태스크 ID 배열)
  const [customOrderPaused, setCustomOrderPaused] = useState<string[]>([]);
  const [customOrderInbox, setCustomOrderInbox] = useState<string[]>([]);
  const [customOrderFiltered, setCustomOrderFiltered] = useState<string[]>([]);

  // URL 쿼리 파라미터에서 초기 메뉴 읽기
  const menuFromUrl = searchParams.get("menu") as SidebarMenuId | null;
  const [activeMenuId, setActiveMenuId] = useState<SidebarMenuId>(
    menuFromUrl && ["inbox", "completed", "starred", "today", "tomorrow", "overdue", "archive"].includes(menuFromUrl)
      ? menuFromUrl
      : "inbox"
  );

  // URL 파라미터 변경 시 메뉴 업데이트
  useEffect(() => {
    if (menuFromUrl && menuFromUrl !== activeMenuId && ["inbox", "completed", "starred", "today", "tomorrow", "overdue", "archive"].includes(menuFromUrl)) {
      setActiveMenuId(menuFromUrl);
      // URL 파라미터 정리 (한 번만 사용)
      setSearchParams({}, { replace: true });
    }
  }, [menuFromUrl, activeMenuId, setSearchParams]);

  // 사이드바 카운트 데이터
  const { counts: sidebarCounts, refresh: refreshCounts } = useSidebarCounts();

  // 태스크 변경 시 카운트 리프레시
  useEffect(() => {
    refreshCounts();
  }, [tasks, refreshCounts]);

  // 앱 시작 시 알림 권한 요청
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 메뉴별 필터링된 태스크
  const filteredTasks = useMemo(() => {
    return filterTasksByMenu(tasks, activeMenuId);
  }, [tasks, activeMenuId]);

  // 태스크 정렬 함수
  const sortTasks = useCallback((taskList: Task[], sortType: SortType, customOrder: string[]): Task[] => {
    if (sortType === "custom" && customOrder.length > 0) {
      // 사용자 정의 순서대로 정렬
      const orderMap = new Map(customOrder.map((id, index) => [id, index]));
      return [...taskList].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Infinity;
        const orderB = orderMap.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    }
    
    return [...taskList].sort((a, b) => {
      switch (sortType) {
        case "created":
          // 최신 생성일순 (내림차순)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "remainingTime":
          // 남은 시간이 많은 순 (내림차순)
          const durationA = a.expectedDuration ?? 0;
          const durationB = b.expectedDuration ?? 0;
          return durationB - durationA;
        case "title":
          // 이름 가나다순 (오름차순)
          return a.title.localeCompare(b.title, "ko");
        default:
          return 0;
      }
    });
  }, []);

  // 필터링된 태스크에서 상태별 분류 (4개 섹션)
  // 진행중 섹션은 정렬 없이 기본 순서 유지
  const inProgressTasks = useMemo(() => {
    return tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS);
  }, [tasks]);

  const pausedTasks = useMemo(() => {
    const filtered = tasks.filter((t) => t.status === TaskStatus.PAUSED);
    return sortTasks(filtered, pausedSortType, customOrderPaused);
  }, [tasks, pausedSortType, customOrderPaused, sortTasks]);

  // 정렬된 필터링 태스크
  const sortedFilteredTasks = useMemo(() => {
    return sortTasks(filteredTasks, filteredSortType, customOrderFiltered);
  }, [filteredTasks, filteredSortType, customOrderFiltered, sortTasks]);

  // 정렬된 inbox 태스크 (showAllSections일 때 사용)
  const sortedInboxTasks = useMemo(() => {
    return sortTasks(filteredTasks, inboxSortType, customOrderInbox);
  }, [filteredTasks, inboxSortType, customOrderInbox, sortTasks]);

  // 드래그앤드롭 순서 변경 핸들러
  const handlePausedReorder = useCallback((taskIds: string[]) => {
    setCustomOrderPaused(taskIds);
    setPausedSortType("custom");
  }, []);

  const handleInboxReorder = useCallback((taskIds: string[]) => {
    setCustomOrderInbox(taskIds);
    setInboxSortType("custom");
  }, []);

  const handleFilteredReorder = useCallback((taskIds: string[]) => {
    setCustomOrderFiltered(taskIds);
    setFilteredSortType("custom");
  }, []);

  // 특정 메뉴에서는 섹션 구분 없이 표시
  const showAllSections = activeMenuId === "inbox";
  const isCompletedView = activeMenuId === "completed";
  const isArchiveView = activeMenuId === "archive";

  // 상태 변경 핸들러 - 일시정지 시 남은 시간도 함께 저장
  const handleStatusChange = useCallback(async (
    taskId: string, 
    newStatus: TaskStatus, 
    options?: StatusChangeOptions
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
        
    // 완료 상태로 변경 시 알림 전송
    if (newStatus === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      sendTaskCompletedNotification(task.title, task.expectedDuration);
    }

    // 완료 상태로 변경 시 남은 시간을 0으로 초기화
    // 일시정지 시에는 options에서 전달받은 남은 시간 저장
    let remainingTimeSeconds: number | undefined;
    if (newStatus === TaskStatus.COMPLETED) {
      remainingTimeSeconds = 0;
    } else if (newStatus === TaskStatus.PAUSED && options?.remainingTimeSeconds !== undefined) {
      remainingTimeSeconds = options.remainingTimeSeconds;
    }

    console.log("[handleStatusChange]", { taskId, newStatus, options, remainingTimeSeconds });
        
    await updateTask({
      id: taskId,
      status: newStatus,
      lastPausedAt: newStatus === TaskStatus.PAUSED ? new Date().toISOString() : undefined,
      completedAt: newStatus === TaskStatus.COMPLETED ? new Date().toISOString() : undefined,
      remainingTimeSeconds,
    });
  }, [tasks, updateTask]);

  const handleTaskSelect = useCallback(async (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await openTaskWindow(task);
    }
  }, [tasks]);

  // 짧은 메모 추가 핸들러
  const handleAddMemo = useCallback(async (taskId: string, memo: TaskMemo) => {
    await addMemo(taskId, memo.content);
  }, [addMemo]);

  // 긴 노트 추가/수정 핸들러
  const handleAddNote = useCallback(async (taskId: string, note: TaskNote) => {
    // 기존 노트인지 확인 (task의 notes에서 해당 ID 찾기)
    const task = tasks.find((t) => t.id === taskId);
    const existingNote = task?.notes?.find((n) => n.id === note.id);
    
    if (existingNote) {
      // 기존 노트 업데이트
      await updateNote(note.id, note.content);
    } else {
      // 새 노트 추가
      await addNote(taskId, note.title, note.content);
    }
  }, [tasks, addNote, updateNote]);

  // 태그 추가 핸들러
  const handleAddTag = useCallback(async (taskId: string, tag: string) => {
    await addTag(taskId, tag);
  }, [addTag]);

  // 태그 제거 핸들러
  const handleRemoveTag = useCallback(async (taskId: string, tag: string) => {
    await removeTag(taskId, tag);
  }, [removeTag]);

  // 중요 표시 토글 핸들러
  const handleToggleImportant = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await updateTask({
        id: taskId,
        isImportant: !task.isImportant,
      });
    }
  }, [tasks, updateTask]);

  // 삭제 핸들러
  const handleDelete = useCallback(async (taskId: string) => {
    await deleteTask(taskId);
  }, [deleteTask]);

  // 목표일 변경 핸들러
  const handleTargetDateChange = useCallback(async (taskId: string, date: Date) => {
    await updateTask({
      id: taskId,
      targetDate: date.toISOString(),
    });
  }, [updateTask]);

  // 보관함으로 이동 핸들러
  const handleArchive = useCallback(async (taskId: string) => {
    await updateTask({
      id: taskId,
      status: TaskStatus.ARCHIVED,
    });
  }, [updateTask]);

  // 시간 추가 핸들러
  const handleExtendTime = useCallback(async (taskId: string, extension: TimeExtensionHistory) => {
    await extendTime({
      taskId,
      addedMinutes: extension.addedMinutes,
      previousDuration: extension.previousDuration,
      newDuration: extension.newDuration,
      reason: extension.reason,
    });
  }, [extendTime]);

  // 타이틀 변경 핸들러
  const handleTitleChange = useCallback(async (taskId: string, title: string) => {
    await updateTask({
      id: taskId,
      title,
    });
  }, [updateTask]);

  // Task 추가 핸들러
  const handleAddTask = useCallback(async (title: string, targetDate: Date, expectedDuration: number) => {
    await createTask({
      title,
      targetDate: targetDate.toISOString(),
      expectedDuration,
      priority: TaskPriority.MEDIUM,
    });
    setIsAddingTask(false);
  }, [createTask]);

  // Task 추가 UI 열기/닫기
  const handleOpenAddTask = useCallback(() => {
    setIsAddingTask(true);
    // 스크롤을 맨 위로 이동
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }, []);

  const handleCloseAddTask = useCallback(() => {
    setIsAddingTask(false);
  }, []);

  // 진행중인 모든 태스크를 일시정지
  const pauseAllInProgressTasks = useCallback(async () => {
    const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS);
    for (const task of inProgressTasks) {
      await updateTask({
        id: task.id,
        status: TaskStatus.PAUSED,
        lastPausedAt: new Date().toISOString(),
      });
    }
  }, [tasks, updateTask]);

  // 사이드바 메뉴 선택 핸들러
  const handleMenuSelect = useCallback(async (menuId: SidebarMenuId) => {
    // 메뉴 이동 시 추가 UI 취소
    if (isAddingTask) {
      setIsAddingTask(false);
    }

    // 메뉴 이동 시 진행중인 태스크 일시정지
    const hasInProgressTasks = tasks.some((t) => t.status === TaskStatus.IN_PROGRESS);
    if (hasInProgressTasks && menuId !== activeMenuId) {
      await pauseAllInProgressTasks();
    }

    if (menuId === "settings") {
      navigate("/settings");
    } else {
      setActiveMenuId(menuId);
    }
  }, [navigate, isAddingTask, tasks, activeMenuId, pauseAllInProgressTasks]);

  // 현재 진행중인 Task (하나만 있다고 가정)
  const currentInProgressTask = inProgressTasks.length > 0 ? inProgressTasks[0] : null;

  // Widget 모드에서 Task 상태 변경 핸들러
  const handleWidgetStatusChange = useCallback((status: TaskStatus) => {
    if (currentInProgressTask) {
      handleStatusChange(currentInProgressTask.id, status);
    }
  }, [currentInProgressTask, handleStatusChange]);

  // 로딩 중 표시
  if (loading && tasks.length === 0) {
    return (
      <AppLayout
        inProgressTask={null}
        onTaskStatusChange={() => {}}
        onAddTaskClick={() => {}}
        onMenuSelect={handleMenuSelect}
        activeMenuId={activeMenuId}
        sidebarCounts={sidebarCounts}
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <svg className="w-10 h-10 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-400">데이터 로딩중...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <AppLayout
        inProgressTask={null}
        onTaskStatusChange={() => {}}
        onAddTaskClick={() => {}}
        onMenuSelect={handleMenuSelect}
        activeMenuId={activeMenuId}
        sidebarCounts={sidebarCounts}
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4 p-6 bg-red-500/10 rounded-xl border border-red-500/30">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => refresh()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 메뉴 타이틀 매핑
  const menuTitles: Record<SidebarMenuId, string> = {
    inbox: "할일",
    completed: "완료",
    starred: "중요",
    today: "오늘",
    tomorrow: "내일",
    overdue: "지연됨",
    archive: "보관함",
    settings: "설정",
  };

  return (
    <AppLayout
      inProgressTask={currentInProgressTask}
      onTaskStatusChange={handleWidgetStatusChange}
      onAddTaskClick={handleOpenAddTask}
      onMenuSelect={handleMenuSelect}
      activeMenuId={activeMenuId}
      sidebarCounts={sidebarCounts}
    >
      <div ref={scrollContainerRef} className="h-full overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* inbox 메뉴: 전체 섹션 표시 */}
          {showAllSections && (
            <>
          {/* 진행중 섹션 */}
          <TaskSection
            title="진행중"
            count={inProgressTasks.length}
            tasks={inProgressTasks}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onStatusChange={handleStatusChange}
            onAddMemo={handleAddMemo}
            onAddNote={handleAddNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
            onTargetDateChange={handleTargetDateChange}
            onArchive={handleArchive}
            onExtendTime={handleExtendTime}
            onTitleChange={handleTitleChange}
            sectionType="inProgress"
          />

          {/* 일시정지 섹션 */}
          <TaskSection
            title="일시정지"
            count={pausedTasks.length}
            tasks={pausedTasks}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onStatusChange={handleStatusChange}
            onAddMemo={handleAddMemo}
            onAddNote={handleAddNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
            onTargetDateChange={handleTargetDateChange}
            onArchive={handleArchive}
            onExtendTime={handleExtendTime}
            onTitleChange={handleTitleChange}
            sectionType="paused"
            sortType={pausedSortType}
            onSortChange={setPausedSortType}
            onTasksReorder={handlePausedReorder}
          />

          {/* 할일 섹션 */}
          <TaskSection
            title="할일"
            count={sortedInboxTasks.length}
            tasks={sortedInboxTasks}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onStatusChange={handleStatusChange}
            onAddMemo={handleAddMemo}
            onAddNote={handleAddNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
            onTargetDateChange={handleTargetDateChange}
            onArchive={handleArchive}
            onExtendTime={handleExtendTime}
            onTitleChange={handleTitleChange}
            showAddTaskForm={isAddingTask}
            onAddTask={handleAddTask}
            onCloseAddTask={handleCloseAddTask}
            sectionType="inbox"
            sortType={inboxSortType}
            onSortChange={setInboxSortType}
            onTasksReorder={handleInboxReorder}
          />
            </>
          )}

          {/* 다른 메뉴: 필터링된 태스크만 표시 */}
          {!showAllSections && (
          <TaskSection
              title={menuTitles[activeMenuId]}
              count={sortedFilteredTasks.length}
              tasks={sortedFilteredTasks}
              selectedTaskId={isCompletedView || isArchiveView ? undefined : selectedTaskId}
              onTaskSelect={isCompletedView || isArchiveView ? undefined : handleTaskSelect}
            onStatusChange={handleStatusChange}
            onAddMemo={handleAddMemo}
            onAddNote={handleAddNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
            onTargetDateChange={handleTargetDateChange}
            onArchive={handleArchive}
            onExtendTime={handleExtendTime}
            onTitleChange={handleTitleChange}
              showAddTaskForm={isAddingTask}
              onAddTask={handleAddTask}
              onCloseAddTask={handleCloseAddTask}
              sectionType={isCompletedView ? "completed" : isArchiveView ? "completed" : "inbox"}
              sortType={filteredSortType}
              onSortChange={setFilteredSortType}
              onTasksReorder={handleFilteredReorder}
            />
          )}

          {/* 빈 상태 */}
          {sortedFilteredTasks.length === 0 && !loading && !showAllSections && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {menuTitles[activeMenuId]} 항목이 없습니다
              </h3>
              <p className="text-slate-400 mb-6">
                {activeMenuId === "starred" && "중요 표시된 작업이 없습니다"}
                {activeMenuId === "today" && "오늘 예정된 작업이 없습니다"}
                {activeMenuId === "tomorrow" && "내일 예정된 작업이 없습니다"}
                {activeMenuId === "overdue" && "지연된 작업이 없습니다 🎉"}
                {activeMenuId === "completed" && "완료된 작업이 없습니다"}
                {activeMenuId === "archive" && "보관된 작업이 없습니다"}
              </p>
            </div>
          )}

          {/* 전체 빈 상태 (inbox) */}
          {/* {showAllSections && tasks.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">작업이 없습니다</h3>
              <p className="text-slate-400 mb-6">첫 번째 작업을 추가해 보세요!</p>
              <button
                onClick={handleOpenAddTask}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-xl transition-colors"
              >
                작업 추가하기
              </button>
            </div>
          )} */}
        </div>
      </div>
    </AppLayout>
  );
};
