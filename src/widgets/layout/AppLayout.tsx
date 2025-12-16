import { useState, useEffect, ReactNode, useCallback } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { PanelLeftClose, PanelLeft, LayoutGrid, Maximize2, Pause } from "lucide-react";
import { motion } from "motion/react";
import { Sidebar, type SidebarMenuId } from "./Sidebar";
import { UserInfo } from "./UserInfo";
import { AddButton } from "@shared/ui";
import { Task, TaskStatus } from "@entities/task";
import { formatTimeMs } from "@features/tasks/shared/lib/timeFormat";
import { useTaskTimer } from "@features/tasks/shared/hooks/useTaskTimer";
import { type SidebarCounts } from "@shared/hooks";

// 태스크 목록 메뉴 ID 목록
const TASK_LIST_MENU_IDS: SidebarMenuId[] = ["inbox", "completed", "starred", "today", "tomorrow", "overdue", "archive"];

interface AppLayoutProps {
  children: ReactNode;
  /** 진행중인 Task (Widget 모드용) */
  inProgressTask?: Task | null;
  /** Task 상태 변경 핸들러 */
  onTaskStatusChange?: (status: TaskStatus) => void;
  /** Task 추가 UI 열기 핸들러 */
  onAddTaskClick?: () => void;
  /** 사이드바 메뉴 선택 핸들러 */
  onMenuSelect?: (menuId: SidebarMenuId) => void;
  /** 현재 선택된 메뉴 */
  activeMenuId?: SidebarMenuId;
  /** 사이드바 카운트 */
  sidebarCounts?: SidebarCounts;
}

// Widget 모드 창 크기 (컴팩트)
const WIDGET_SIZE = { width: 220, height: 140 };
// 일반 모드 창 크기
const NORMAL_SIZE = { width: 700, height: 800 };
// 창 크기 변경 애니메이션 설정
const RESIZE_ANIMATION_STEPS = 16;
const RESIZE_ANIMATION_DURATION = 300; // ms

// 색상 상수
const COLORS = {
  sidebar: "#2B2D31",
  main: "#1E1F22",
};

// 사이드바 애니메이션 시간 (ms)
const SIDEBAR_ANIMATION_DURATION = 300;

export const AppLayout = ({ children, inProgressTask, onTaskStatusChange, onAddTaskClick, onMenuSelect, activeMenuId = "inbox", sidebarCounts }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMainHeaderButtons, setShowMainHeaderButtons] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const appWindow = getCurrentWindow();

  // Widget 모드용 타이머 훅
  const {
    remainingTimeMs,
    progress,
    handlePause,
  } = useTaskTimer({
    expectedDuration: inProgressTask?.expectedDuration ?? 5,
    isInProgress: isWidgetMode && inProgressTask?.status === TaskStatus.IN_PROGRESS,
    taskTitle: inProgressTask?.title ?? "",
    onStatusChange: onTaskStatusChange,
  });

  // 창 크기를 부드럽게 애니메이션하는 함수
  const animateWindowSize = useCallback(async (
    fromSize: { width: number; height: number },
    toSize: { width: number; height: number }
  ) => {
    const stepDelay = RESIZE_ANIMATION_DURATION / RESIZE_ANIMATION_STEPS;
    
    for (let i = 1; i <= RESIZE_ANIMATION_STEPS; i++) {
      // easeOutCubic 이징 함수
      const t = i / RESIZE_ANIMATION_STEPS;
      const eased = 1 - Math.pow(1 - t, 3);
      
      const currentWidth = Math.round(fromSize.width + (toSize.width - fromSize.width) * eased);
      const currentHeight = Math.round(fromSize.height + (toSize.height - fromSize.height) * eased);
      
      await appWindow.setSize(new LogicalSize(currentWidth, currentHeight));
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }
  }, [appWindow]);

  // Mock 사용자 데이터
  const mockUser = {
    name: "TaskManager",
    email: "@taskmanager",
  };

  // 사이드바 상태 변경 시 메인 헤더 버튼 표시 딜레이 처리
  useEffect(() => {
    if (!isSidebarOpen) {
      // 사이드바가 닫힐 때: 애니메이션 완료 후 버튼 표시
      const timer = setTimeout(() => {
        setShowMainHeaderButtons(true);
      }, SIDEBAR_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    } else {
      // 사이드바가 열릴 때: 즉시 버튼 숨김
      setShowMainHeaderButtons(false);
    }
  }, [isSidebarOpen]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSignIn = () => {
    console.log("Sign in clicked");
  };

  const handleClose = () => appWindow.close();
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();

  // Widget 모드 명시적 종료 (토글이 아닌 단방향)
  const exitWidgetMode = useCallback(async () => {
    if (!isWidgetMode || isTransitioning) return;
    
    setIsTransitioning(true);
    await animateWindowSize(WIDGET_SIZE, NORMAL_SIZE);
    await appWindow.setAlwaysOnTop(false);
    setIsWidgetMode(false);
    setIsTransitioning(false);
  }, [isWidgetMode, isTransitioning, appWindow, animateWindowSize]);

  // Widget 모드 토글 핸들러 (애니메이션 포함)
  const handleToggleWidgetMode = useCallback(async () => {
    if (isTransitioning) return;
    
    const newWidgetMode = !isWidgetMode;
    setIsTransitioning(true);
    
    if (newWidgetMode) {
      // Widget 모드로 전환: 창 크기 축소
      setIsWidgetMode(true);
      await appWindow.setAlwaysOnTop(true);
      await animateWindowSize(NORMAL_SIZE, WIDGET_SIZE);
    } else {
      // 일반 모드로 복귀: 창 크기 확대
      await animateWindowSize(WIDGET_SIZE, NORMAL_SIZE);
      await appWindow.setAlwaysOnTop(false);
      setIsWidgetMode(false);
    }
    
    setIsTransitioning(false);
  }, [isWidgetMode, isTransitioning, appWindow, animateWindowSize]);

  // Widget 모드에서 Play 중인 Task가 없으면 자동으로 일반 모드로 복귀
  // 토글 대신 명시적 종료 함수를 사용하여 play 시 다시 위젯으로 전환되는 것을 방지
  useEffect(() => {
    if (isWidgetMode && (!inProgressTask || inProgressTask.status !== TaskStatus.IN_PROGRESS)) {
      exitWidgetMode();
    }
  }, [isWidgetMode, inProgressTask, exitWidgetMode]);

  // 진행률 퍼센트 계산
  const progressPercent = Math.round(progress * 100);

  // Widget 모드 UI - 중앙 정렬, 미니멀하고 차분한 디자인
  if (isWidgetMode && inProgressTask) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-screen w-screen overflow-hidden relative"
        style={{ backgroundColor: "transparent" }}
      >
        {/* 메인 컨테이너 */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#111214" }}
        >
          {/* 컨텐츠 영역 - 전체 드래그 가능 */}
          <div 
            data-tauri-drag-region
            className="relative z-10 h-full flex flex-col items-center justify-center p-4"
          >
            {/* 복귀 버튼 - 우측 상단 */}
            <motion.button
              whileHover={{ scale: 1.1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleWidgetMode}
              className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-all opacity-40"
              title="일반 모드로 복귀"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </motion.button>

            {/* 중앙 콘텐츠 */}
            <div className="flex flex-col items-center gap-2 w-full">
              {/* 타이틀 */}
              <h1 
                className="text-sm font-semibold text-white/90 truncate max-w-full text-center px-2"
                data-tauri-drag-region
              >
                {inProgressTask.title}
              </h1>

              {/* 타이머 - 중앙 대형 */}
              <div 
                className="font-mono text-3xl font-bold tracking-tight text-white"
                data-tauri-drag-region
              >
                {formatTimeMs(remainingTimeMs)}
              </div>

              {/* 진행률 - 원형 링 형태 */}
              <div className="flex items-center gap-3 mt-1">
                {/* 원형 프로그레스 인디케이터 */}
                <div className="relative w-8 h-8">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                    {/* 배경 원 */}
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="3"
                    />
                    {/* 프로그레스 원 */}
                    <motion.circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="#4ADE80"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${progress * 88} 88`}
                      initial={{ strokeDasharray: "88 88" }}
                      animate={{ strokeDasharray: `${progress * 88} 88` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                </div>

                {/* 퍼센트 텍스트 */}
                <span className="text-lg font-semibold text-emerald-400 tabular-nums">
                  {progressPercent}%
                </span>

                {/* 일시정지 버튼 */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePause}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <Pause className="w-4 h-4 text-gray-400" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden rounded-xl">
      {/* 좌측 사이드바 영역 (헤더 포함) */}
      <div
        className={`
          flex flex-col h-full flex-shrink-0
          transition-[width] duration-300 ease-in-out overflow-hidden
          ${isSidebarOpen ? "w-64" : "w-0"}
        `}
        style={{ backgroundColor: COLORS.sidebar }}
      >
        {/* 내부 컨텐츠 */}
        <div
          className={`
            flex flex-col h-full w-64
            transition-opacity duration-200 ease-in-out
            ${isSidebarOpen ? "opacity-100 delay-100" : "opacity-0"}
          `}
        >
          {/* 사이드바 헤더 (신호등 + 토글) */}
          <div
            data-tauri-drag-region
            className="titlebar h-12 flex items-center select-none border-b border-white/5"
          >
            <div className="titlebar-buttons flex items-center gap-4 pl-4 pr-4">
              {/* macOS 신호등 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all group flex items-center justify-center"
                >
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/60 font-bold leading-none">
                    ×
                  </span>
                </button>
                <button
                  onClick={handleMinimize}
                  className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all group flex items-center justify-center"
                >
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/60 font-bold leading-none">
                    −
                  </span>
                </button>
                <button
                  onClick={handleMaximize}
                  className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all group flex items-center justify-center"
                >
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/60 font-bold leading-none">
                    ⤢
                  </span>
                </button>
              </div>

              {/* 구분선 */}
              <div className="w-px h-5 bg-white/10" />

              {/* 사이드바 토글 버튼 */}
              <button
                onClick={handleToggleSidebar}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 사이드바 네비게이션 */}
          <div className="flex-1 overflow-y-auto">
            <Sidebar 
              isOpen={isSidebarOpen} 
              activeItemId={activeMenuId}
              counts={sidebarCounts}
              onItemSelect={onMenuSelect}
            />
          </div>

          {/* 사용자 정보 */}
          <div className="border-t border-white/5">
            <UserInfo user={mockUser} onSignIn={handleSignIn} />
          </div>
        </div>
      </div>

      {/* 우측 메인 영역 (헤더 포함) */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{ backgroundColor: COLORS.main }}
      >
        {/* 메인 헤더 */}
        <div
          data-tauri-drag-region
          className="titlebar h-12 flex items-center select-none border-b border-white/5"
        >
          {/* 사이드바가 닫힌 후 애니메이션 완료 시 버튼 표시 */}
          <div
            className={`
              titlebar-buttons flex items-center gap-4 pl-4
              transition-all duration-200 ease-out
              ${showMainHeaderButtons ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"}
            `}
          >
            {/* macOS 신호등 버튼 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all group flex items-center justify-center"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/60 font-bold leading-none">
                  ×
                </span>
              </button>
              <button
                onClick={handleMinimize}
                className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all group flex items-center justify-center"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/60 font-bold leading-none">
                  −
                </span>
              </button>
              <button
                onClick={handleMaximize}
                className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all group flex items-center justify-center"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/60 font-bold leading-none">
                  ⤢
                </span>
              </button>
            </div>

            {/* 구분선 */}
            <div className="w-px h-5 bg-white/10" />

            {/* 사이드바 열기 버튼 */}
            <button
              onClick={handleToggleSidebar}
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
          
          {/* 드래그 가능한 영역 */}
          <div data-tauri-drag-region className="flex-1 h-full" />

          {/* Widget 모드 버튼 + 새 할일 추가 버튼 */}
          <div className="titlebar-buttons flex items-center gap-2 pr-4">
            {/* Widget 모드 버튼 (진행중인 Task가 있을 때만 표시) */}
            {inProgressTask && inProgressTask.status === TaskStatus.IN_PROGRESS && (
              <button
                onClick={handleToggleWidgetMode}
                className="p-2 rounded-lg text-gray-400 hover:text-[#FF6B00] hover:bg-[#FF6B00]/10 transition-all"
                title="Widget 모드로 전환"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}
            {/* 추가하기 버튼: 태스크 목록 메뉴일 때만 표시 */}
            {TASK_LIST_MENU_IDS.includes(activeMenuId) && onAddTaskClick && (
              <AddButton
                label="추가하기"
                onClick={onAddTaskClick}
              />
            )}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};
