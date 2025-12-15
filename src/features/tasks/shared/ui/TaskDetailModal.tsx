import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, MessageSquare, FileText, Timer, History } from "lucide-react";
import { Task, TaskRunHistory, TimeExtensionHistory } from "@entities/task";
import type { ModalTabType } from "../types";
import { MemoTabContent } from "./tabs/MemoTabContent";
import { NoteTabContent } from "./tabs/NoteTabContent";
import { HistoryTabContent } from "./tabs/HistoryTabContent";
import { TimeTabContent } from "./tabs/TimeTabContent";

export interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  activeTab: ModalTabType;
  sortedHistory: TaskRunHistory[];
  sortedTimeExtensions: TimeExtensionHistory[];
  expectedDurationText: string;
  memoInput: string;
  noteContent: string;
  timeExtendMinutes: number;
  onClose: (e?: React.MouseEvent) => void;
  onTabChange: (tab: ModalTabType) => void;
  onMemoInputChange: (value: string) => void;
  onNoteContentChange: (value: string) => void;
  onTimeExtendMinutesChange: (value: number) => void;
  onAddMemo: (e: React.FormEvent) => void;
  onAddNote: (e: React.FormEvent) => void;
  onExtendTime: (e: React.FormEvent) => void;
}

export const TaskDetailModal = ({
  task,
  isOpen,
  activeTab,
  sortedHistory,
  sortedTimeExtensions,
  expectedDurationText,
  memoInput,
  noteContent,
  timeExtendMinutes,
  onClose,
  onTabChange,
  onMemoInputChange,
  onNoteContentChange,
  onTimeExtendMinutesChange,
  onAddMemo,
  onAddNote,
  onExtendTime,
}: TaskDetailModalProps) => {
  if (!isOpen) return null;

  const tabs = [
    { key: "memo" as const, label: "메모", icon: MessageSquare, count: task.memos?.length },
    { key: "note" as const, label: "노트", icon: FileText, count: undefined },
    { key: "time" as const, label: "시간", icon: Timer, count: sortedTimeExtensions.length },
    { key: "history" as const, label: "히스토리", icon: History, count: sortedHistory.length },
  ];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-[#1C1E22] rounded-2xl w-full max-w-lg mx-4 h-[600px] overflow-hidden shadow-2xl border border-gray-700/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-200 truncate flex-1 mr-4">
            {task.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-700/50">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-colors
                ${activeTab === key 
                  ? "text-[#FF6B00] border-b-2 border-[#FF6B00] bg-[#FF6B00]/5" 
                  : "text-gray-500 hover:text-gray-300"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              {(count || 0) > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === key ? "bg-[#FF6B00]/20" : "bg-gray-700"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === "memo" && (
            <MemoTabContent
              memos={task.memos}
              memoInput={memoInput}
              onMemoInputChange={onMemoInputChange}
              onAddMemo={onAddMemo}
            />
          )}

          {activeTab === "note" && (
            <NoteTabContent
              notes={task.notes}
              noteContent={noteContent}
              onNoteContentChange={onNoteContentChange}
              onAddNote={onAddNote}
            />
          )}

          {activeTab === "history" && (
            <HistoryTabContent sortedHistory={sortedHistory} />
          )}

          {activeTab === "time" && (
            <TimeTabContent
              expectedDurationText={expectedDurationText}
              sortedTimeExtensions={sortedTimeExtensions}
              timeExtendMinutes={timeExtendMinutes}
              onTimeExtendMinutesChange={onTimeExtendMinutesChange}
              onExtendTime={onExtendTime}
            />
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
