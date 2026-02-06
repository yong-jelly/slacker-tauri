import { useEffect, useCallback } from "react";
import { SHORTCUTS, ShortcutDef } from "../lib/shortcuts";

type ShortcutHandler = () => void;
type ShortcutMap = Record<string, ShortcutHandler>;

interface UseKeyboardShortcutsOptions {
  handlers: ShortcutMap;
  disabled?: boolean;
}

export const useKeyboardShortcuts = ({ handlers, disabled = false }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // 입력 요소에 포커스가 있을 때의 처리
      const activeElement = document.activeElement as HTMLElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.isContentEditable);

      // 플랫폼별 modifier 키 확인 (macOS: metaKey, others: ctrlKey)
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierPressed = isMac ? event.metaKey : event.ctrlKey;

      // 입력 중일 때는 modifier 키가 없는 단축키는 무시 (예: J, K, Space)
      // 단, Escape는 예외로 처리할 수도 있음 (여기서는 Escape는 별도 단축키로 정의되지 않음)
      if (isInputFocused && !modifierPressed && event.key !== "Escape") {
        return;
      }

      // 등록된 단축키 확인
      const matchedShortcut = SHORTCUTS.find((shortcut) => {
        // 키 파싱 (예: "⌘+N", "Space", "↑ / K")
        const parts = shortcut.keys.split(" / ")[0].split("+");
        const key = parts[parts.length - 1].toLowerCase();
        const hasCommand = shortcut.keys.includes("⌘");
        
        // 키 매칭 로직
        const eventKey = event.key.toLowerCase();
        
        // Modifier 체크
        if (hasCommand && !modifierPressed) return false;
        if (!hasCommand && modifierPressed) return false;

        // 특수 키 처리
        if (key === "space" && eventKey === " ") return true;
        if (key === "enter" && eventKey === "enter") return true;
        if (key === "escape" && eventKey === "escape") return true;
        if (key === "↑" && eventKey === "arrowup") return true;
        if (key === "↓" && eventKey === "arrowdown") return true;
        if (key === "⌫" && (eventKey === "backspace" || eventKey === "delete")) return true;

        // 일반 키 처리
        return key === eventKey;
      });

      if (matchedShortcut && handlers[matchedShortcut.id]) {
        event.preventDefault();
        handlers[matchedShortcut.id]();
      }
    },
    [handlers, disabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
