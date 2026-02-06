import { motion, AnimatePresence } from "motion/react";
import { SHORTCUTS, ShortcutDef } from "../lib/shortcuts";
import { X } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp = ({ isOpen, onClose }: KeyboardShortcutsHelpProps) => {
  // 카테고리별로 단축키 그룹화
  const categories = {
    navigation: SHORTCUTS.filter((s) => s.category === "navigation"),
    task: SHORTCUTS.filter((s) => s.category === "task"),
    app: SHORTCUTS.filter((s) => s.category === "app"),
  };

  const categoryLabels = {
    navigation: "네비게이션",
    task: "태스크 관리",
    app: "앱 컨트롤",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[#1E1F22] border border-white/10 rounded-2xl shadow-2xl w-[800px] max-h-[80vh] overflow-hidden pointer-events-auto flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#2B2D31]/50">
                <h2 className="text-lg font-semibold text-white">키보드 단축키</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto grid grid-cols-2 gap-8">
                {/* Left Column: Navigation & App */}
                <div className="space-y-8">
                  <ShortcutSection
                    title={categoryLabels.navigation}
                    shortcuts={categories.navigation}
                  />
                  <ShortcutSection
                    title={categoryLabels.app}
                    shortcuts={categories.app}
                  />
                </div>

                {/* Right Column: Task */}
                <div>
                  <ShortcutSection
                    title={categoryLabels.task}
                    shortcuts={categories.task}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 bg-[#2B2D31]/30 text-center">
                <p className="text-sm text-gray-500">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-xs font-mono text-gray-300 mr-1">Esc</kbd>
                  키를 눌러 닫기
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ShortcutSection = ({ title, shortcuts }: { title: string; shortcuts: ShortcutDef[] }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
    <div className="space-y-2">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.id} className="flex items-center justify-between group">
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
            {shortcut.label}
          </span>
          <div className="flex gap-1">
            {shortcut.keys.split(" / ").map((keyCombo, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <span className="mx-1 text-gray-600">/</span>}
                <kbd className="px-2 py-1 min-w-[24px] text-center rounded bg-[#2B2D31] border border-white/10 text-xs font-mono text-gray-300 shadow-sm">
                  {keyCombo}
                </kbd>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
