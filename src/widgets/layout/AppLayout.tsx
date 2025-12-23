import { useState, useEffect, ReactNode, useCallback } from "react";
import { getCurrentWindow, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";
import { currentMonitor, availableMonitors, primaryMonitor } from "@tauri-apps/api/window";
import { PanelLeftClose, PanelLeft, LayoutGrid, Maximize2, Pause, Play, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { Sidebar, type SidebarMenuId } from "./Sidebar";
import { UserInfo } from "./UserInfo";
import { AddButton } from "@shared/ui";
import { Task, TaskStatus } from "@entities/task";
import { formatTimeMs } from "@features/tasks/shared/lib/timeFormat";
import { useTaskTimer } from "@features/tasks/shared/hooks/useTaskTimer";
import { type SidebarCounts } from "@shared/hooks";
import { saveWindowState, loadWindowState, getDefaultWindowState } from "@shared/lib/windowStateStorage";

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

// Widget 모드 창 크기 (고정)
const WIDGET_SIZE = { width: 300, height: 180 };

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
  const [showWidgetButtons, setShowWidgetButtons] = useState(false);
  const appWindow = getCurrentWindow();

  // Widget 모드용 타이머 훅
  const {
    remainingTimeMs,
    progress,
    isRunning,
    handlePlay,
    handlePause,
  } = useTaskTimer({
    expectedDuration: inProgressTask?.expectedDuration ?? 5,
    savedRemainingTimeSeconds: inProgressTask?.remainingTimeSeconds,
    isInProgress: !!inProgressTask,
    taskTitle: inProgressTask?.title ?? "",
    onStatusChange: onTaskStatusChange,
  });


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

  // 저장된 위치가 유효한 모니터 범위 내에 있는지 확인하고 조정하는 함수
  const validateAndAdjustPosition = useCallback(async (
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): Promise<{ x: number; y: number }> => {
    try {
      const monitors = await availableMonitors();
      if (!monitors || monitors.length === 0) {
        console.warn("No monitors available, returning original position");
        return position;
      }

      // 저장된 위치가 어떤 모니터 범위 내에 있는지 확인
      for (const monitor of monitors) {
        const monitorX = monitor.position.x;
        const monitorY = monitor.position.y;
        const monitorWidth = monitor.size.width;
        const monitorHeight = monitor.size.height;

        // 창이 모니터 범위 내에 있는지 확인 (일부라도 보이면 유효)
        const windowRight = position.x + size.width;
        const windowBottom = position.y + size.height;
        const monitorRight = monitorX + monitorWidth;
        const monitorBottom = monitorY + monitorHeight;

        // 창이 모니터와 겹치는지 확인
        if (
          position.x < monitorRight &&
          windowRight > monitorX &&
          position.y < monitorBottom &&
          windowBottom > monitorY
        ) {
          // 유효한 모니터 범위 내에 있음
          // 화면 밖으로 나가지 않도록 조정
          const adjustedX = Math.max(monitorX, Math.min(position.x, monitorRight - size.width));
          const adjustedY = Math.max(monitorY, Math.min(position.y, monitorBottom - size.height));
          
          if (adjustedX !== position.x || adjustedY !== position.y) {
            console.log("Adjusted position to fit within monitor:", {
              original: position,
              adjusted: { x: adjustedX, y: adjustedY },
              monitor: { x: monitorX, y: monitorY, width: monitorWidth, height: monitorHeight }
            });
          }
          
          return { x: adjustedX, y: adjustedY };
        }
      }

      // 어떤 모니터 범위에도 없으면 현재 모니터 또는 기본 모니터의 안전한 위치로 이동
      const currentMon = await currentMonitor();
      const targetMonitor = currentMon || (await primaryMonitor()) || monitors[0];
      
      if (targetMonitor) {
        const safeX = targetMonitor.position.x + 50; // 안전 여백
        const safeY = targetMonitor.position.y + 50;
        
        console.log("Position not in any monitor, moving to safe position:", {
          original: position,
          safe: { x: safeX, y: safeY },
          monitor: {
            x: targetMonitor.position.x,
            y: targetMonitor.position.y,
            width: targetMonitor.size.width,
            height: targetMonitor.size.height
          }
        });
        
        return { x: safeX, y: safeY };
      }

      // 모니터 정보를 가져올 수 없으면 원래 위치 반환
      return position;
    } catch (error) {
      console.error("Failed to validate position:", error);
      return position;
    }
  }, []);

  // Widget 모드 명시적 종료 (토글이 아닌 단방향)
  const exitWidgetMode = useCallback(async () => {
    if (!isWidgetMode || isTransitioning) return;
    
    setIsTransitioning(true);
    
    try {
      // 저장된 상태 불러오기 (없으면 기본값 사용)
      const savedState = loadWindowState();
      const restoreState = savedState || getDefaultWindowState();
      
      console.log("ExitWidgetMode: Restoring window state:", restoreState);
      
      // 먼저 resizable 활성화 (크기 변경을 위해)
      await appWindow.setResizable(true);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // alwaysOnTop 해제
      await appWindow.setAlwaysOnTop(false);
      console.log("ExitWidgetMode: AlwaysOnTop set to false");
      
      // 창 크기 복원 (애니메이션 없이 즉시)
      await appWindow.setSize(new LogicalSize(restoreState.size.width, restoreState.size.height));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 위치 복원 (기본 위치가 아닌 경우)
      if (restoreState.position.x >= 0 && restoreState.position.y >= 0) {
        // 다중 모니터 환경에서 위치 유효성 검증 및 조정
        const validatedPosition = await validateAndAdjustPosition(
          restoreState.position,
          restoreState.size
        );
        await appWindow.setPosition(new LogicalPosition(validatedPosition.x, validatedPosition.y));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setIsWidgetMode(false);
      console.log("ExitWidgetMode: Normal mode restored");
    } catch (error) {
      console.error("Exit widget mode error:", error);
    } finally {
      setIsTransitioning(false);
    }
  }, [isWidgetMode, isTransitioning, appWindow, validateAndAdjustPosition]);

  // PhysicalSize를 LogicalSize로 변환하는 함수 (DPI 스케일링 고려)
  const convertPhysicalToLogical = useCallback(async (
    physicalSize: { width: number; height: number }
  ): Promise<{ width: number; height: number }> => {
    try {
      const monitor = await currentMonitor();
      if (!monitor) {
        // 모니터 정보를 가져올 수 없으면 그대로 반환 (변환 불가)
        console.warn("Cannot get monitor info, returning physical size as-is");
        return physicalSize;
      }
      
      const scaleFactor = monitor.scaleFactor;
      return {
        width: Math.round(physicalSize.width / scaleFactor),
        height: Math.round(physicalSize.height / scaleFactor),
      };
    } catch (error) {
      console.error("Failed to convert physical to logical size:", error);
      return physicalSize;
    }
  }, []);

  // PhysicalPosition을 LogicalPosition으로 변환하는 함수 (DPI 스케일링 고려)
  const convertPhysicalToLogicalPosition = useCallback(async (
    physicalPosition: { x: number; y: number }
  ): Promise<{ x: number; y: number }> => {
    try {
      const monitor = await currentMonitor();
      if (!monitor) {
        // 모니터 정보를 가져올 수 없으면 그대로 반환 (변환 불가)
        console.warn("Cannot get monitor info, returning physical position as-is");
        return physicalPosition;
      }
      
      const scaleFactor = monitor.scaleFactor;
      return {
        x: Math.round(physicalPosition.x / scaleFactor),
        y: Math.round(physicalPosition.y / scaleFactor),
      };
    } catch (error) {
      console.error("Failed to convert physical to logical position:", error);
      return physicalPosition;
    }
  }, []);

  // Widget 모드 토글 핸들러
  const handleToggleWidgetMode = useCallback(async () => {
    if (isTransitioning) {
      console.log("Widget mode toggle: Already transitioning, skipping");
      return;
    }
    
    const newWidgetMode = !isWidgetMode;
    console.log("Widget mode toggle:", { from: isWidgetMode, to: newWidgetMode });
    setIsTransitioning(true);
    
    try {
      if (newWidgetMode) {
        // Widget 모드로 전환: 현재 상태 저장 후 크기 고정
        const currentPhysicalSize = await appWindow.outerSize();
        const currentPhysicalPosition = await appWindow.outerPosition();
        
        // PhysicalSize를 LogicalSize로 변환 (DPI 스케일링 제거)
        const logicalSize = await convertPhysicalToLogical({
          width: currentPhysicalSize.width,
          height: currentPhysicalSize.height,
        });
        
        // PhysicalPosition을 LogicalPosition으로 변환 (DPI 스케일링 제거)
        const logicalPosition = await convertPhysicalToLogicalPosition({
          x: currentPhysicalPosition.x,
          y: currentPhysicalPosition.y,
        });
        
        // 비정상적으로 큰 크기는 저장하지 않음 (DPI 스케일링 문제 방지)
        // 최대 크기 제한: 2000x2000 (일반적으로 이보다 큰 창은 없음)
        const MAX_REASONABLE_SIZE = 2000;
        const sizeToSave = {
          width: logicalSize.width > MAX_REASONABLE_SIZE ? 700 : logicalSize.width,
          height: logicalSize.height > MAX_REASONABLE_SIZE ? 800 : logicalSize.height,
        };
        
        console.log("Saving window state:", { 
          physical: { 
            size: { width: currentPhysicalSize.width, height: currentPhysicalSize.height },
            position: { x: currentPhysicalPosition.x, y: currentPhysicalPosition.y }
          },
          logical: {
            size: logicalSize,
            position: logicalPosition
          },
          saved: {
            size: sizeToSave,
            position: logicalPosition
          }
        });
        
        // 현재 상태 저장 (LogicalSize/LogicalPosition 사용하여 DPI 일관성 유지)
        saveWindowState({
          size: sizeToSave,
          position: logicalPosition,
          resizable: true, // 일반 모드는 항상 resizable
        });
        
        // Widget 모드로 전환
        setIsWidgetMode(true);
        
        // 창이 보이도록 보장
        await appWindow.show();
        try {
          await appWindow.unminimize();
        } catch (error) {
          // unminimize 실패해도 계속 진행 (이미 최소화되지 않았을 수 있음)
          console.log("unminimize failed (may already be unminimized):", error);
        }
        
        // resizable을 먼저 활성화하여 크기 변경 가능하도록 함
        await appWindow.setResizable(true);
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 크기를 변경 (애니메이션 없이 즉시)
        console.log("Setting widget size:", WIDGET_SIZE);
        await appWindow.setSize(new LogicalSize(WIDGET_SIZE.width, WIDGET_SIZE.height));
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 크기 변경 확인 및 재시도
        let actualSize = await appWindow.outerSize();
        let retryCount = 0;
        while ((Math.abs(actualSize.width - WIDGET_SIZE.width) > 1 || Math.abs(actualSize.height - WIDGET_SIZE.height) > 1) && retryCount < 3) {
          retryCount++;
          console.log(`Size not applied correctly (attempt ${retryCount}/3), retrying...`, { 
            expected: WIDGET_SIZE, 
            actual: { width: actualSize.width, height: actualSize.height } 
          });
          await appWindow.setSize(new LogicalSize(WIDGET_SIZE.width, WIDGET_SIZE.height));
          await new Promise(resolve => setTimeout(resolve, 100));
          actualSize = await appWindow.outerSize();
        }
        
        console.log("Final widget size:", { width: actualSize.width, height: actualSize.height });
        
        // 위치는 현재 위치 유지 (설정에 따라 변경하지 않음)
        
        // alwaysOnTop 설정
        await appWindow.setAlwaysOnTop(true);
        console.log("AlwaysOnTop set to true");
        
        // 창 크기 고정
        await appWindow.setResizable(false);
        console.log("Resizable set to false");
        
        // 포커스 설정
        await appWindow.setFocus();
        console.log("Widget mode enabled");
      } else {
        // 일반 모드로 복귀: 저장된 상태 복원
        const savedState = loadWindowState();
        const restoreState = savedState || getDefaultWindowState();
        
        console.log("Restoring window state:", restoreState);
        
        // 먼저 resizable 활성화 (크기 변경을 위해)
        await appWindow.setResizable(true);
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // alwaysOnTop 해제
        await appWindow.setAlwaysOnTop(false);
        console.log("AlwaysOnTop set to false");
        
        // 창 크기 복원 (LogicalSize 사용하여 DPI 일관성 유지)
        await appWindow.setSize(new LogicalSize(restoreState.size.width, restoreState.size.height));
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 위치 복원 (기본 위치가 아닌 경우)
        if (restoreState.position.x >= 0 && restoreState.position.y >= 0) {
          // 다중 모니터 환경에서 위치 유효성 검증 및 조정
          const validatedPosition = await validateAndAdjustPosition(
            restoreState.position,
            restoreState.size
          );
          await appWindow.setPosition(new LogicalPosition(validatedPosition.x, validatedPosition.y));
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        setIsWidgetMode(false);
        console.log("Normal mode restored");
      }
    } catch (error) {
      console.error("Widget mode toggle error:", error);
    } finally {
      setIsTransitioning(false);
    }
  }, [isWidgetMode, isTransitioning, appWindow, convertPhysicalToLogical, convertPhysicalToLogicalPosition, validateAndAdjustPosition]);

  // Widget 모드에서 진행중이거나 일시정지된 Task가 없으면 자동으로 일반 모드로 복귀
  // 토글 대신 명시적 종료 함수를 사용하여 play 시 다시 위젯으로 전환되는 것을 방지
  useEffect(() => {
    if (isWidgetMode && (!inProgressTask || (inProgressTask.status !== TaskStatus.IN_PROGRESS && inProgressTask.status !== TaskStatus.PAUSED))) {
      exitWidgetMode();
    }
  }, [isWidgetMode, inProgressTask, exitWidgetMode]);

  // 완료 핸들러
  const handleComplete = useCallback(async () => {
    if (onTaskStatusChange) {
      onTaskStatusChange(TaskStatus.COMPLETED);
    }
    // 완료 후 창 모드로 복귀
    await exitWidgetMode();
  }, [onTaskStatusChange, exitWidgetMode]);

  // Widget 모드 UI - 중앙 정렬, 미니멀하고 차분한 디자인
  // 진행중이거나 일시정지된 태스크가 있을 때만 위젯 모드 UI 표시
  if (isWidgetMode && inProgressTask && (inProgressTask.status === TaskStatus.IN_PROGRESS || inProgressTask.status === TaskStatus.PAUSED)) {
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
          className="absolute inset-0 rounded-2xl overflow-hidden backdrop-blur-md"
          style={{ backgroundColor: "#111214" }}
          onMouseEnter={() => setShowWidgetButtons(true)}
          onMouseLeave={() => setShowWidgetButtons(false)}
          onClick={() => setShowWidgetButtons(true)}
        >
          {/* 컨텐츠 영역 - 전체 드래그 가능 */}
          <div 
            data-tauri-drag-region
            className="relative z-10 h-full flex flex-col items-center justify-center p-4"
          >
            {/* 중앙 콘텐츠 */}
            <div className="flex flex-col items-center gap-3 w-full mt-0">
              {/* 타이틀 */}
              <h1 
                className="font-semibold text-white/90 truncate max-w-full text-center px-2"
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

              {/* 진행률 - 가로 프로그레스 바 */}
              <motion.div 
                className="w-full max-w-[240px] mt-1"
                initial={{ opacity: 1 }}
                animate={{ opacity: showWidgetButtons ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* 중앙 버튼 영역 - 3개 버튼 가로 배치 (오버랩) */}
          <motion.div 
            className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 z-20 px-4 py-2 rounded-lg backdrop-blur-sm"
            style={{ backgroundColor: "rgba(17, 18, 20, 0.9)" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: showWidgetButtons ? 1 : 0,
              scale: showWidgetButtons ? 1 : 0.9
            }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 일시정지/재생 토글 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isRunning ? handlePause : handlePlay}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
              title={isRunning ? "일시정지" : "재생"}
            >
              {isRunning ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </motion.button>

            {/* 완료 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
              title="완료"
            >
              <CheckCircle className="w-5 h-5" />
            </motion.button>

            {/* 창 모드로 돌아가기 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exitWidgetMode}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
              title="창 모드로 돌아가기"
            >
              <Maximize2 className="w-5 h-5" />
            </motion.button>
          </motion.div>
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
            {/* Widget 모드 버튼 (진행중이거나 일시정지된 Task가 있을 때만 표시) */}
            {inProgressTask && (inProgressTask.status === TaskStatus.IN_PROGRESS || inProgressTask.status === TaskStatus.PAUSED) && (
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
