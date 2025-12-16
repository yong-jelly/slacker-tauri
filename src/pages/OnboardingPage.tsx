import { useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { join, downloadDir } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDbStatus } from "@shared/hooks";

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  const { initDb, loadExistingDb, error } = useDbStatus();
  const [busyAction, setBusyAction] = useState<"init" | "load" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const appWindow = getCurrentWindow();

  const handleClose = () => appWindow.close();
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();

  // 기본 파일명 생성 (slacker-user-db-yyyymmdd-hhmm.db)
  const generateDefaultFileName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `slacker-user-db-${year}${month}${day}-${hour}${minute}.db`;
  };

  // 새 DB를 특정 경로에 생성 (파일 경로 직접 지정)
  const handleCreateNew = async () => {
    setBusyAction("init");
    setLocalError(null);
    try {
      const defaultPath = await downloadDir();
      const defaultFileName = generateDefaultFileName();
      
      // save 다이얼로그 사용 - 새 파일 생성용
      const selected = await save({
        title: "새 DB 파일 저장 위치를 선택하세요",
        defaultPath: await join(defaultPath, defaultFileName),
        filters: [
          { name: "SQLite DB", extensions: ["db", "sqlite", "sqlite3"] },
        ],
      });
      
      if (selected) {
        // 선택된 경로가 .db 확장자가 없으면 추가
        let filePath = selected as string;
        if (!filePath.endsWith(".db") && !filePath.endsWith(".sqlite") && !filePath.endsWith(".sqlite3")) {
          filePath = filePath + ".db";
        }
        await initDb(filePath);
        onComplete();
      }
    } catch (e) {
      setLocalError(String(e));
    } finally {
      setBusyAction(null);
    }
  };

  // 기존 DB 파일 불러오기
  const handleLoadExisting = async () => {
    setBusyAction("load");
    setLocalError(null);
    try {
      const selected = await open({
        multiple: false,
        title: "기존 DB 파일을 선택하세요",
        filters: [
          { name: "SQLite DB", extensions: ["db", "sqlite", "sqlite3"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (selected) {
        await loadExistingDb(selected as string);
        onComplete();
      }
    } catch (e) {
      setLocalError(String(e));
    } finally {
      setBusyAction(null);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: "#1E1F22" }}>
      {/* 헤더 - 신호등 버튼 + 드래그 영역 */}
      <div
        data-tauri-drag-region
        className="h-12 flex items-center select-none flex-shrink-0 border-b border-white/5"
      >
        <div className="titlebar-buttons flex items-center gap-2 pl-4">
          {/* macOS 신호등 버튼 */}
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
        {/* 드래그 가능한 영역 */}
        <div data-tauri-drag-region className="flex-1 h-full" />
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          {/* 로고 영역 */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Slacker
            </h1>
            <p className="text-slate-400 text-lg">
              Task Timer for Focused Work
            </p>
          </div>

          {/* 메인 카드 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-2">
              데이터베이스 설정
            </h2>
            <p className="text-slate-400 mb-8">
              앱은 SQLite 파일 하나로 모든 데이터를 관리합니다.
              <br />
              파일을 다른 기기로 복사하면 그대로 사용할 수 있어요.
            </p>

            {/* 에러 메시지 */}
            {displayError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{displayError}</p>
              </div>
            )}

            {/* 버튼들 */}
            <div className="space-y-4">
              {/* 새 DB 생성 (경로 지정) */}
              <button
                onClick={handleCreateNew}
                disabled={busyAction !== null}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
              >
                {busyAction === "init" ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                새 DB 만들기
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-800/50 text-slate-500">또는</span>
                </div>
              </div>

              {/* 기존 파일 불러오기 */}
              <button
                onClick={handleLoadExisting}
                disabled={busyAction !== null}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busyAction === "load" ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                기존 DB 파일 불러오기
              </button>
            </div>
          </div>

          {/* 하단 정보 */}
          <p className="text-center text-slate-500 text-sm mt-6">
            데이터는 로컬에만 저장되며, 클라우드로 전송되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
