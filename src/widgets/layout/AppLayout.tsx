import { useState, ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { UserInfo } from "./UserInfo";
import { AddButton } from "@shared/ui";

interface AppLayoutProps {
  children: ReactNode;
}

// 색상 상수
const COLORS = {
  sidebar: "#2B2D31",
  main: "#1E1F22",
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const appWindow = getCurrentWindow();

  // Mock 사용자 데이터
  const mockUser = {
    name: "용택 권",
    email: "yongtaek@example.com",
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSignIn = () => {
    console.log("Sign in clicked");
  };

  const handleClose = () => appWindow.close();
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();

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
            <Sidebar isOpen={isSidebarOpen} />
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
          {/* 사이드바가 닫혔을 때 토글 버튼 표시 */}
          {!isSidebarOpen && (
            <div className="titlebar-buttons flex items-center gap-4 pl-4">
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
          )}
          
          {/* 드래그 가능한 영역 */}
          <div data-tauri-drag-region className="flex-1 h-full" />

          {/* 새 할일 추가 버튼 */}
          <div className="titlebar-buttons flex items-center pr-4">
            <AddButton
              label="추가하기"
              onClick={() => console.log("Add new task")}
            />
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};
