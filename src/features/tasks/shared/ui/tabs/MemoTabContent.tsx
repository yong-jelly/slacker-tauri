import { motion } from "motion/react";
import { Send } from "lucide-react";
import { TaskMemo } from "@entities/task";
import { formatDateTime } from "../../lib/timeFormat";

export interface MemoTabContentProps {
  memos?: TaskMemo[];
  memoInput: string;
  onMemoInputChange: (value: string) => void;
  onAddMemo: (e: React.FormEvent) => void;
}

export const MemoTabContent = ({ 
  memos, 
  memoInput, 
  onMemoInputChange, 
  onAddMemo 
}: MemoTabContentProps) => (
  <div className="space-y-4">
    <form onSubmit={onAddMemo} className="flex items-center gap-2 pb-4 border-b border-gray-700/30">
      <input
        type="text"
        value={memoInput}
        onChange={(e) => onMemoInputChange(e.target.value)}
        placeholder="새 메모 작성..."
        className="flex-1 text-sm bg-gray-700/30 border border-gray-600/30 rounded-lg px-4 py-2.5 outline-none focus:border-[#FF6B00]/50 text-gray-200 placeholder-gray-500"
      />
      <motion.button
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`p-2.5 rounded-lg transition-colors ${
          memoInput.trim() 
            ? "text-white bg-[#FF6B00] hover:bg-[#FF8A3D]" 
            : "text-gray-600 bg-gray-700/30"
        }`}
        disabled={!memoInput.trim()}
      >
        <Send className="w-4 h-4" />
      </motion.button>
    </form>

    {memos && memos.length > 0 ? (
      <div className="space-y-4">
        {/* 최신 순으로 정렬하여 표시 (createdAt은 이미 Date 객체) */}
        {[...memos]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map((memo) => (
          <div
            key={memo.id}
            className="bg-gray-700/20 rounded-lg p-4 px-4 py-3 border border-gray-600/20"
          >
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
              <span>{formatDateTime(memo.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-300">{memo.content}</p>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500 text-sm">
        아직 메모가 없습니다
      </div>
    )}
  </div>
);

