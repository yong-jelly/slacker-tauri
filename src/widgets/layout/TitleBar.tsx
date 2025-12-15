import { getCurrentWindow } from "@tauri-apps/api/window";
import { PanelLeftClose, PanelLeft } from "lucide-react";

interface TitleBarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TitleBar = ({ isSidebarOpen, onToggleSidebar }: TitleBarProps) => {
  const appWindow = getCurrentWindow();

  const handleClose = () => appWindow.close();
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();

  return (
    <div
      data-tauri-drag-region
      className="titlebar h-12 flex items-center bg-[#1a1d1a] border-b border-white/5 select-none"
    >
      {/* 왼쪽 영역: 신호등 + 토글 버튼 */}
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
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 드래그 가능한 중앙 영역 */}
      <div data-tauri-drag-region className="flex-1 h-full" />
    </div>
  );
};
