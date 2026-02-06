import { motion } from "motion/react";
import { 
  Calendar, ArrowRight, Archive, Hash, Send, 
  MessageSquare, AlertTriangle, CheckCircle2
} from "lucide-react";
import { Task, TaskMemo, TaskStatus } from "@entities/task";
import { formatRelativeTime } from "../lib/timeFormat";
import type { ModalTabType } from "../types";

interface TaskDetailExpandedProps {
  task: Task;
  targetDateText: string;
  delayDays: number;
  isDelayed: boolean;
  latestMemo: TaskMemo | null;
  memoInput: string;
  tagInput: string;
  onMemoInputChange: (value: string) => void;
  onTagInputChange: (value: string) => void;
  onAddMemo: (e: React.FormEvent) => void;
  onAddTag: (e: React.FormEvent) => void;
  onRemoveTag: (e: React.MouseEvent, tag: string) => void;
  onPostponeToTomorrow: (e: React.MouseEvent) => void;
  onPostponeToToday: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
  onOpenModal: (e: React.MouseEvent, tab: ModalTabType) => void;
}

export const TaskDetailExpanded = ({
  task,
  targetDateText,
  delayDays,
  isDelayed,
  latestMemo,
  memoInput,
  tagInput,
  onMemoInputChange,
  onTagInputChange,
  onAddMemo,
  onAddTag,
  onRemoveTag,
  onPostponeToTomorrow,
  onPostponeToToday,
  onArchive,
  onOpenModal,
}: TaskDetailExpandedProps) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="pt-4 mt-3 border-t border-gray-600/30 space-y-4">
        {/* 완료일 표시 (완료 상태일 때) */}
        {(task.status === "completed" || task.status === TaskStatus.COMPLETED) && task.completedAt && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-green-500/10 border border-green-500/20 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">완료일</span>
              <span className="font-medium text-green-500">
                {formatRelativeTime(task.completedAt)}
              </span>
            </div>
          </div>
        )}

        {/* 목표일 및 지연 알림 (완료 상태가 아닐 때만 표시) */}
        {task.status !== "completed" && task.status !== TaskStatus.COMPLETED && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 목표일 카드 */}
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                ${isDelayed 
                  ? "bg-red-500/15 border border-red-500/30" 
                  : targetDateText === "오늘" 
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : "bg-gray-700/30 border border-gray-600/30"
                }
              `}>
                {isDelayed ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">목표일</span>
                  <span className={`font-medium ${
                    isDelayed ? "text-red-400" :
                    targetDateText === "오늘" ? "text-blue-400" : "text-gray-300"
                  }`}>
                    {targetDateText}
                  </span>
                  {isDelayed && (
                    <span className="text-red-400 text-[10px]">
                      ({delayDays}일 지연)
                    </span>
                  )}
                </div>
                {/* 내일로/오늘로 버튼: 지연 시 오늘로, 오늘이면 내일로, 내일이면 숨김 */}
                {(isDelayed || targetDateText !== "내일") && (
                  <button
                    onClick={isDelayed ? onPostponeToToday : onPostponeToTomorrow}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-gray-600/30 transition-colors ml-1"
                  >
                    <ArrowRight className="w-2.5 h-2.5" />
                    {isDelayed ? "오늘로" : "내일로"}
                  </button>
                )}
              </div>
              
              {/* 보관함 */}
              <button
                onClick={onArchive}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 px-2.5 py-1.5 rounded-lg hover:bg-gray-600/30 transition-colors border border-transparent hover:border-gray-600/50"
              >
                <Archive className="w-3 h-3" />
                보관함
              </button>
            </div>
          </div>
        )}


        {/* 태그 섹션 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Hash className="w-3 h-3" />
            <span>태그</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {task.tags?.map((tag) => (
              <motion.span
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/15 px-2.5 py-1 rounded-full group border border-blue-500/20"
              >
                #{tag}
                <button
                  onClick={(e) => onRemoveTag(e, tag)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-300 hover:text-red-400"
                >
                  ×
                </button>
              </motion.span>
            ))}
            <form onSubmit={onAddTag} className="flex-shrink-0">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="#태그 추가"
                className="w-24 text-xs bg-gray-700/20 border border-gray-600/30 rounded-full px-3 py-1 focus:border-blue-500 outline-none text-gray-300 placeholder-gray-600"
              />
            </form>
          </div>
        </div>

        {/* 메모 섹션 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <MessageSquare className="w-3 h-3" />
              <span>메모</span>
            </div>
            {(task.memos?.length || 0) > 1 && (
              <button
                onClick={(e) => onOpenModal(e, "memo")}
                className="text-[10px] text-blue-400 hover:text-blue-300"
              >
                전체 보기 ({task.memos?.length})
              </button>
            )}
          </div>
          
          {/* 최신 메모 1개만 표시 */}
          {latestMemo && (
            <div className="text-xs bg-gray-700/20 rounded-lg px-3 py-2 border border-gray-600/20">
              <div className="flex items-center justify-between text-gray-500 text-[10px] mb-1">
                {/* formatRelativeTime은 Date 객체 또는 문자열을 받아서 로컬 시간대 기준으로 처리 */}
                <span>{formatRelativeTime(latestMemo.createdAt)}</span>
              </div>
              <p className="text-gray-300">{latestMemo.content}</p>
            </div>
          )}

          {/* 메모 입력 */}
          <form 
            onSubmit={onAddMemo}
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={memoInput}
              onChange={(e) => onMemoInputChange(e.target.value)}
              placeholder="빠른 메모 남기기..."
              className="flex-1 text-xs bg-gray-700/20 border border-gray-600/30 rounded-lg px-3 py-2 outline-none focus:border-gray-500 text-gray-300 placeholder-gray-600"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-colors ${
                memoInput.trim() 
                  ? "text-[#FF6B00] bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30" 
                  : "text-gray-600 bg-gray-700/20"
              }`}
              disabled={!memoInput.trim()}
            >
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

