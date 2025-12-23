import { useState, useCallback, useMemo, useEffect } from "react";
import { X, MessageSquare, FileText, Timer, History } from "lucide-react";
import { Task } from "@entities/task";
import type { ModalTabType } from "@features/tasks/shared/types";
import { MemoTabContent } from "@features/tasks/shared/ui/tabs/MemoTabContent";
import { NoteTabContent } from "@features/tasks/shared/ui/tabs/NoteTabContent";
import { HistoryTabContent } from "@features/tasks/shared/ui/tabs/HistoryTabContent";
import { TimeTabContent } from "@features/tasks/shared/ui/tabs/TimeTabContent";
import { formatDurationWithSpent } from "@features/tasks/shared/lib/timeFormat";
import { useTasks } from "@shared/hooks";

// 천 단위 이상 숫자를 1.4k 형태로 포맷
const formatCount = (count: number | undefined): string | undefined => {
  if (count === undefined || count === 0) return undefined;
  if (count >= 1000) {
    const formatted = (count / 1000).toFixed(1);
    return formatted.endsWith('.0') 
      ? `${Math.floor(count / 1000)}k` 
      : `${formatted}k`;
  }
  return count.toString();
};

interface TaskSettingsPageProps {
  task: Task;
  onClose: () => void;
}

export const TaskSettingsPage = ({ task, onClose }: TaskSettingsPageProps) => {
  const { addMemo, addNote, updateNote, extendTime } = useTasks();
  
  const [activeTab, setActiveTab] = useState<ModalTabType>("memo");
  const [memoInput, setMemoInput] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [timeExtendMinutes, setTimeExtendMinutes] = useState(5);

  // 최신 노트 초기값 설정
  const latestNote = task.notes?.length ? task.notes[task.notes.length - 1] : null;
  useEffect(() => {
    if (latestNote) {
      setNoteContent(latestNote.content);
    }
  }, [latestNote]);

  // 정렬된 히스토리
  const sortedHistory = useMemo(() => {
    return [...(task.runHistory || [])].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [task.runHistory]);

  const sortedTimeExtensions = useMemo(() => {
    return [...(task.timeExtensions || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [task.timeExtensions]);

  const sortedActionHistory = useMemo(() => {
    return [...(task.actionHistory || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [task.actionHistory]);

  // 예상 시간 텍스트
  const expectedDurationText = formatDurationWithSpent(
    task.expectedDuration ?? 5,
    task.remainingTimeSeconds
  );

  // 핸들러들
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAddMemo = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoInput.trim()) return;
    
    await addMemo(task.id, memoInput.trim());
    setMemoInput("");
  }, [memoInput, task.id, addMemo]);

  const handleAddNote = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    
    if (latestNote) {
      // 기존 노트 업데이트
      await updateNote(latestNote.id, noteContent.trim());
    } else {
      // 새 노트 추가
      await addNote(task.id, "", noteContent.trim());
    }
  }, [noteContent, task.id, addNote, updateNote, latestNote]);

  const handleExtendTime = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeExtendMinutes === 0) return;
    
    const currentDuration = task.expectedDuration ?? 5;
    const newDuration = Math.max(1, currentDuration + timeExtendMinutes);
    
    await extendTime({
      taskId: task.id,
      addedMinutes: timeExtendMinutes,
      previousDuration: currentDuration,
      newDuration: newDuration,
      reason: "",
    });
    
    setTimeExtendMinutes(5);
  }, [timeExtendMinutes, task.expectedDuration, task.id, extendTime]);

  const tabs = [
    { key: "memo" as const, label: "메모", icon: MessageSquare, count: task.memos?.length },
    { key: "note" as const, label: "노트", icon: FileText, count: undefined },
    { key: "time" as const, label: "시간", icon: Timer, count: sortedTimeExtensions.length },
    { key: "history" as const, label: "히스토리", icon: History, count: sortedActionHistory.length },
  ];

  return (
    <div className="w-full h-full bg-[#1E1F22] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 h-12">
        <div className="flex-1" />
        <div className="flex items-center justify-center px-4">
          <h2 className="text-sm font-medium text-gray-200 truncate">
            {task.title} 설정
          </h2>
        </div>
        <div className="flex items-center gap-2 pr-4">
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-700/50">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap
                ${activeTab === key 
                  ? "text-[#FF6B00] border-b-2 border-[#FF6B00] bg-[#FF6B00]/5" 
                  : "text-gray-500 hover:text-gray-300"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              {formatCount(count) && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] whitespace-nowrap ${
                  activeTab === key ? "bg-[#FF6B00]/20" : "bg-gray-700"
                }`}>
                  {formatCount(count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "memo" && (
            <MemoTabContent
              memos={task.memos}
              memoInput={memoInput}
              onMemoInputChange={setMemoInput}
              onAddMemo={handleAddMemo}
            />
          )}

          {activeTab === "note" && (
            <NoteTabContent
              notes={task.notes}
              noteContent={noteContent}
              onNoteContentChange={setNoteContent}
              onAddNote={handleAddNote}
            />
          )}

          {activeTab === "history" && (
            <HistoryTabContent 
              sortedHistory={sortedHistory} 
              sortedActionHistory={sortedActionHistory}
            />
          )}

          {activeTab === "time" && (
            <TimeTabContent
              expectedDurationText={expectedDurationText}
              sortedTimeExtensions={sortedTimeExtensions}
              timeExtendMinutes={timeExtendMinutes}
              onTimeExtendMinutesChange={setTimeExtendMinutes}
              onExtendTime={handleExtendTime}
            />
          )}
        </div>
      </div>
    </div>
  );
};

