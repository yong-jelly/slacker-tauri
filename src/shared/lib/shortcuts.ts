export interface ShortcutDef {
  id: string;
  keys: string;        // 표시용 ("Cmd+N")
  label: string;       // 설명 ("새 태스크 추가")
  category: "navigation" | "task" | "app";
}

export const SHORTCUTS: ShortcutDef[] = [
  // 네비게이션
  { id: "nav-inbox",    keys: "⌘+1", label: "할일",    category: "navigation" },
  { id: "nav-completed",keys: "⌘+2", label: "완료",    category: "navigation" },
  { id: "nav-starred",  keys: "⌘+3", label: "중요",    category: "navigation" },
  { id: "nav-today",    keys: "⌘+4", label: "오늘",    category: "navigation" },
  { id: "nav-tomorrow", keys: "⌘+5", label: "내일",    category: "navigation" },
  { id: "nav-overdue",  keys: "⌘+6", label: "지연됨",  category: "navigation" },
  { id: "nav-archive",  keys: "⌘+7", label: "보관함",  category: "navigation" },
  
  // 태스크 관리
  { id: "add-task",     keys: "⌘+N", label: "새 태스크 추가", category: "task" },
  { id: "toggle-play",  keys: "Space",label: "시작/일시정지",  category: "task" },
  { id: "complete-task", keys: "⌘+D", label: "완료 처리",     category: "task" },
  { id: "delete-task",  keys: "⌘+⌫", label: "삭제",          category: "task" },
  { id: "star-task",    keys: "⌘+S", label: "중요 표시 토글",  category: "task" },
  { id: "nav-up",       keys: "↑ / K",label: "이전 태스크",   category: "task" },
  { id: "nav-down",     keys: "↓ / J",label: "다음 태스크",   category: "task" },
  { id: "expand-task",  keys: "Enter",label: "상세 열기/닫기", category: "task" },
  
  // 앱
  { id: "toggle-sidebar",keys: "⌘+B", label: "사이드바 토글", category: "app" },
  { id: "toggle-widget", keys: "⌘+W", label: "위젯 모드",    category: "app" },
  { id: "show-help",     keys: "⌘+/", label: "단축키 도움말", category: "app" },
  { id: "settings",      keys: "⌘+,", label: "설정",         category: "app" },
];
