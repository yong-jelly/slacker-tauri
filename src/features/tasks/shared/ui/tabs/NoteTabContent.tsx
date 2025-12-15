import { motion } from "motion/react";
import { FileText } from "lucide-react";
import { TaskNote } from "@entities/task";
import { formatDateTime } from "../../lib/timeFormat";

export interface NoteTabContentProps {
  notes?: TaskNote[];
  noteContent: string;
  onNoteContentChange: (value: string) => void;
  onAddNote: (e: React.FormEvent) => void;
}

export const NoteTabContent = ({ 
  notes, 
  noteContent, 
  onNoteContentChange, 
  onAddNote 
}: NoteTabContentProps) => {
  // 가장 최근 노트의 저장 날짜
  const lastSavedDate = notes && notes.length > 0 
    ? notes.reduce((latest, note) => 
        new Date(note.createdAt) > new Date(latest.createdAt) ? note : latest
      ).createdAt
    : null;

  return (
    <div className="space-y-4">
      <form onSubmit={onAddNote} className="space-y-3">
        <textarea
          value={noteContent}
          onChange={(e) => onNoteContentChange(e.target.value)}
          placeholder="노트 내용을 작성하세요..."
          rows={18}
          className="w-full text-sm bg-gray-700/30 border border-gray-600/30 rounded-lg px-4 py-3 outline-none focus:border-[#FF6B00]/50 text-gray-200 placeholder-gray-500 resize-none"
        />
        <div className="flex items-center justify-end gap-3">
          {lastSavedDate && (
            <span className="text-[10px] text-gray-500">
              마지막 저장: {formatDateTime(lastSavedDate)}
            </span>
          )}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              noteContent.trim() 
                ? "text-white bg-[#FF6B00] hover:bg-[#FF8A3D]" 
                : "text-gray-600 bg-gray-700/30"
            }`}
            disabled={!noteContent.trim()}
          >
            <FileText className="w-4 h-4" />
            노트 저장
          </motion.button>
        </div>
      </form>
    </div>
  );
};

