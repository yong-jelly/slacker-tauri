import { useState, useEffect, useCallback } from "react";
import { HashRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { MainPage, OnboardingPage, SettingsPage } from "@pages/index";
import { TaskDetailPage } from "@pages/TaskDetailPage";
import { TaskWidgetPage } from "@pages/TaskWidgetPage";
import { useDbStatus, useTasks } from "@shared/hooks";

// 앱 상태 타입
type AppState = "loading" | "onboarding" | "ready";

export const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppRoot />} />
        <Route path="/settings" element={<SettingsPageWrapper />} />
        <Route path="/task/:id" element={<TaskDetailPageWrapper />} />
        <Route path="/widget" element={<TaskWidgetPage />} />
      </Routes>
    </HashRouter>
  );
};

// 메인 앱 루트 - DB 상태에 따라 온보딩 또는 메인 페이지 표시
const AppRoot = () => {
  const { status, loading } = useDbStatus();
  const [appState, setAppState] = useState<AppState>("loading");

  useEffect(() => {
    if (loading) {
      setAppState("loading");
      return;
    }

    // DB 미설정 또는 파일 없음 → 온보딩
    if (!status?.configured || !status?.exists) {
      setAppState("onboarding");
      return;
    }

    // DB 준비됨 → 메인 화면
    setAppState("ready");
  }, [status, loading]);

  const handleOnboardingComplete = useCallback(() => {
    setAppState("ready");
  }, []);

  // 로딩 화면
  if (appState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-12 h-12 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400">로딩중...</p>
        </div>
      </div>
    );
  }

  // 온보딩 화면
  if (appState === "onboarding") {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  // 메인 화면
  return <MainPage />;
};

// 설정 페이지 래퍼
const SettingsPageWrapper = () => {
  const navigate = useNavigate();

  const handleBack = useCallback((menuId?: string) => {
    // 선택한 메뉴로 이동 (쿼리 파라미터 사용)
    if (menuId && menuId !== "inbox") {
      navigate(`/?menu=${menuId}`);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleDbChange = useCallback(() => {
    // DB 변경 시 메인으로 이동하여 상태 재확인
    navigate("/");
  }, [navigate]);

  return <SettingsPage onBack={handleBack} onDbChange={handleDbChange} />;
};

// Task 상세 페이지 래퍼
const TaskDetailPageWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const { tasks, loading } = useTasks();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200/40 via-purple-200/40 to-orange-200/40 backdrop-blur-2xl p-6 flex items-center justify-center">
        <div className="text-white">로딩중...</div>
      </div>
    );
  }

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200/40 via-purple-200/40 to-orange-200/40 backdrop-blur-2xl p-6 flex items-center justify-center">
        <div className="text-white">작업을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return <TaskDetailPage task={task} />;
};
