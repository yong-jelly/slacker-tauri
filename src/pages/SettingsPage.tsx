import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronDown } from "lucide-react";
import { useDbStatus, useSettings, useTableViewer, useSidebarCounts, useAppVersion } from "@shared/hooks";
import { AppLayout } from "@widgets/index";
import { SettingsSelect, SettingsInput, SettingsToggle } from "@shared/ui";
import { type SidebarMenuId } from "@widgets/layout/Sidebar";

interface SettingsPageProps {
  onBack: (menuId?: SidebarMenuId) => void;
  onDbChange: () => void;
}

export const SettingsPage = ({ onBack, onDbChange }: SettingsPageProps) => {
  const { status, loadExistingDb, logout } = useDbStatus();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    timerDefaultMinutes,
    setTimerDefaultMinutes,
    notificationSound,
    setNotificationSound,
    notificationVibration,
    setNotificationVibration,
    loading: settingsLoading,
  } = useSettings();
  const { tables, selectedTable, rows, selectTable, loading: tableLoading } = useTableViewer();
  const { counts: sidebarCounts } = useSidebarCounts();
  const appVersion = useAppVersion();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 사이드바 메뉴 선택 핸들러
  const handleMenuSelect = (menuId: SidebarMenuId) => {
    if (menuId !== "settings") {
      onBack(menuId);
    }
  };

  // 다른 DB 파일로 변경
  const handleChangeDb = async () => {
    setBusyAction("change");
    setError(null);
    try {
      const selected = await open({
        multiple: false,
        title: "다른 DB 파일을 선택하세요",
        filters: [
          { name: "SQLite DB", extensions: ["db", "sqlite", "sqlite3"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (selected) {
        await loadExistingDb(selected as string);
        onDbChange();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyAction(null);
    }
  };

  // 로그아웃 (DB 연결 해제)
  const handleLogout = async () => {
    setBusyAction("logout");
    setError(null);
    try {
      await logout();
      onDbChange();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyAction(null);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppLayout
      inProgressTask={null}
      onTaskStatusChange={() => {}}
      onMenuSelect={handleMenuSelect}
      activeMenuId="settings"
      sidebarCounts={sidebarCounts}
    >
      <div className="h-full overflow-y-auto">
        <div className="flex flex-col items-center py-8 px-4">
          {/* 고정 너비 컨테이너 */}
          <div className="w-full max-w-[480px] space-y-6">
            {/* 페이지 타이틀 */}
            <h1 className="text-xl font-semibold text-white">설정</h1>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* 데이터베이스 섹션 */}
            <section className="bg-[#2B2D31] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h2 className="text-sm font-medium text-white">데이터베이스</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* 현재 DB 정보 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">현재 DB 파일</p>
                    <p className="text-white text-sm font-mono truncate" title={status?.path}>
                      {status?.path || "-"}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      크기: {formatBytes(status?.sizeBytes)} · 테이블: {status?.tables.length || 0}개
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status?.exists ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        연결됨
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        미연결
                      </span>
                    )}
                  </div>
                </div>

                {/* DB 버튼들 */}
                <div className="flex gap-3">
                  <button
                    onClick={handleChangeDb}
                    disabled={busyAction !== null}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg border border-white/5 transition-colors disabled:opacity-50"
                  >
                    {busyAction === "change" ? "로딩중..." : "다른 DB 파일 선택"}
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={busyAction !== null}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {busyAction === "logout" ? "처리중..." : "연결 해제"}
                  </button>
                </div>
              </div>
            </section>

            {/* 앱 설정 섹션 */}
            <section className="bg-[#2B2D31] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h2 className="text-sm font-medium text-white">앱 설정</h2>
              </div>
              <div className="divide-y divide-white/5">
                {/* 테마 */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">테마</p>
                    <p className="text-gray-500 text-xs mt-0.5">앱의 색상 테마를 설정합니다</p>
                  </div>
                  <SettingsSelect
                    value={theme}
                    onChange={setTheme}
                    disabled={settingsLoading}
                    options={[
                      { value: "system", label: "시스템 설정" },
                      { value: "light", label: "라이트" },
                      { value: "dark", label: "다크" },
                    ]}
                    className="w-32"
                  />
                </div>

                {/* 언어 */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">언어</p>
                    <p className="text-gray-500 text-xs mt-0.5">앱의 표시 언어를 설정합니다</p>
                  </div>
                  <SettingsSelect
                    value={language}
                    onChange={setLanguage}
                    disabled={settingsLoading}
                    options={[
                      { value: "ko", label: "한국어" },
                      { value: "en", label: "English" },
                    ]}
                    className="w-32"
                  />
                </div>

                {/* 기본 타이머 시간 */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">기본 타이머 시간</p>
                    <p className="text-gray-500 text-xs mt-0.5">새 작업의 기본 예상 시간</p>
                  </div>
                  <SettingsInput
                    type="number"
                    value={timerDefaultMinutes}
                    onChange={(v) => setTimerDefaultMinutes(v as number)}
                    min={1}
                    max={120}
                    disabled={settingsLoading}
                    suffix="분"
                  />
                </div>

                {/* 알림 소리 */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">알림 소리</p>
                    <p className="text-gray-500 text-xs mt-0.5">타이머 완료 시 소리 알림</p>
                  </div>
                  <SettingsToggle
                    checked={notificationSound}
                    onChange={setNotificationSound}
                    disabled={settingsLoading}
                  />
                </div>

                {/* 알림 진동 */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">알림 진동</p>
                    <p className="text-gray-500 text-xs mt-0.5">타이머 완료 시 진동 알림</p>
                  </div>
                  <SettingsToggle
                    checked={notificationVibration}
                    onChange={setNotificationVibration}
                    disabled={settingsLoading}
                  />
                </div>
              </div>
            </section>

            {/* 고급 설정 (테이블 조회) */}
            <section className="bg-[#2B2D31] rounded-xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">고급 설정</p>
                    <p className="text-gray-500 text-xs">개발자용 데이터베이스 조회</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                />
              </button>

              {showAdvanced && (
                <div className="border-t border-white/5">
                  <div className="p-5 space-y-4">
                    {/* 테이블 선택 */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">테이블 선택</label>
                      <SettingsSelect
                        value={selectedTable || ""}
                        onChange={(v) => v && selectTable(v)}
                        options={[
                          { value: "", label: "테이블을 선택하세요" },
                          ...tables.map((table) => ({ value: table, label: table })),
                        ]}
                        className="w-full"
                      />
                    </div>

                    {/* 테이블 내용 */}
                    {selectedTable && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500">
                            {selectedTable} ({rows.length}행)
                          </p>
                          {tableLoading && (
                            <svg className="w-4 h-4 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          )}
                        </div>
                        <div className="overflow-x-auto bg-[#1E1F22] rounded-lg border border-white/5">
                          {rows.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/5">
                                  {rows[0].columns.map((col) => (
                                    <th
                                      key={col}
                                      className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap text-xs"
                                    >
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {rows.map((row, i) => (
                                  <tr key={i} className="hover:bg-white/5">
                                    {row.values.map((val, j) => (
                                      <td
                                        key={j}
                                        className="px-3 py-2 text-gray-300 whitespace-nowrap max-w-[200px] truncate text-xs"
                                        title={String(val ?? "")}
                                      >
                                        {val === null ? (
                                          <span className="text-gray-600 italic">NULL</span>
                                        ) : (
                                          String(val)
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="px-4 py-8 text-center text-gray-600 text-sm">데이터가 없습니다</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* 앱 정보 */}
            <section className="text-center text-gray-500 text-xs py-4">
              <p>미루미(MIRUMI) v{appVersion}</p>
              <p className="mt-1">데이터는 로컬에만 저장됩니다</p>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
