import { useState, ReactNode } from "react";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { UserInfo } from "./UserInfo";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mock 사용자 데이터 (실제로는 인증 상태에서 가져와야 함)
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

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1C1A23] overflow-hidden rounded-xl">
      {/* 타이틀바 */}
      <TitleBar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바 + 사용자 정보 */}
        <aside
          className={`
            flex flex-col h-full bg-[#1a1d1a] border-r border-white/5 flex-shrink-0
            transition-[width] duration-300 ease-in-out overflow-hidden
            ${isSidebarOpen ? "w-56" : "w-0"}
          `}
        >
          {/* 내부 컨텐츠 - opacity는 별도로 더 느리게 전환 */}
          <div
            className={`
              flex flex-col h-full w-56 
              transition-opacity duration-200 ease-in-out
              ${isSidebarOpen ? "opacity-100 delay-100" : "opacity-0"}
            `}
          >
            {/* 사이드바 네비게이션 */}
            <div className="flex-1 overflow-y-auto">
              <Sidebar isOpen={isSidebarOpen} />
            </div>

            {/* 사용자 정보 */}
            <div className="border-t border-white/5">
              <UserInfo user={mockUser} onSignIn={handleSignIn} />
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-hidden transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>
    </div>
  );
};
