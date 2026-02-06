import { motion, AnimatePresence } from "motion/react";
import { SHORTCUTS, ShortcutDef } from "../lib/shortcuts";

interface CommandKeyOverlayProps {
  isVisible: boolean;
}

export const CommandKeyOverlay = ({ isVisible }: CommandKeyOverlayProps) => {
  // 카테고리별로 주요 단축키 필터링
  const categories = {
    navigation: SHORTCUTS.filter((s) => s.category === "navigation"),
    task: SHORTCUTS.filter((s) => s.category === "task" && ["add-task", "toggle-play", "complete-task", "nav-up", "expand-task"].includes(s.id)),
    app: SHORTCUTS.filter((s) => s.category === "app"),
  };

  const categoryLabels = {
    navigation: "네비게이션",
    task: "태스크",
    app: "앱",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Overlay Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[#1E1F22]/95 border border-white/10 rounded-xl shadow-2xl p-6 w-auto min-w-[600px] max-w-[800px]">
              <div className="grid grid-cols-3 gap-8">
                {/* Navigation */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {categoryLabels.navigation}
                  </h3>
                  <div className="space-y-1.5">
                    {categories.navigation.map((shortcut) => (
                      <ShortcutRow key={shortcut.id} shortcut={shortcut} compact />
                    ))}
                  </div>
                </div>

                {/* Task */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {categoryLabels.task}
                  </h3>
                  <div className="space-y-1.5">
                    {categories.task.map((shortcut) => (
                      <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                    ))}
                  </div>
                </div>

                {/* App */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {categoryLabels.app}
                  </h3>
                  <div className="space-y-1.5">
                    {categories.app.map((shortcut) => (
                      <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-[11px] text-gray-500">
                  <span className="text-gray-400 font-medium">⌘</span> 키를 놓으면 닫힙니다
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ShortcutRow = ({ shortcut, compact = false }: { shortcut: ShortcutDef; compact?: boolean }) => {
  // 키 조합 분리 (예: "⌘+1" -> ["⌘", "1"])
  const keys = shortcut.keys.split(" / ")[0].split("+");
  
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-gray-300 truncate">
        {shortcut.label}
      </span>
      <div className="flex gap-1 flex-shrink-0">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className={`
              flex items-center justify-center rounded bg-[#2B2D31] border border-white/10 
              text-[11px] font-mono text-gray-300 shadow-sm
              ${compact && key === "⌘" ? "hidden" : ""} 
              ${key.length > 1 ? "px-1.5 min-w-[20px]" : "w-5 h-5"}
            `}
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
};
