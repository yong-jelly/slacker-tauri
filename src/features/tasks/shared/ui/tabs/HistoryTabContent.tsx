import { TaskRunHistory, TaskActionHistory } from "@entities/task";
import { formatDateTime, formatMinutes } from "../../lib/timeFormat";
import { Play, Pause, Check, Archive, Plus, RotateCcw, Clock } from "lucide-react";

export interface HistoryTabContentProps {
  sortedHistory: TaskRunHistory[];
  sortedActionHistory: TaskActionHistory[];
}

// 액션 타입별 아이콘과 색상
const getActionInfo = (actionType: string) => {
  switch (actionType) {
    case "CREATED":
      return { icon: Plus, color: "text-blue-400", bg: "bg-blue-500/20", label: "생성" };
    case "STARTED":
      return { icon: Play, color: "text-green-400", bg: "bg-green-500/20", label: "실행" };
    case "PAUSED":
      return { icon: Pause, color: "text-yellow-400", bg: "bg-yellow-500/20", label: "일시정지" };
    case "COMPLETED":
      return { icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "완료" };
    case "ARCHIVED":
      return { icon: Archive, color: "text-purple-400", bg: "bg-purple-500/20", label: "보관" };
    case "RESTORED":
      return { icon: RotateCcw, color: "text-cyan-400", bg: "bg-cyan-500/20", label: "복원" };
    default:
      return { icon: Clock, color: "text-gray-400", bg: "bg-gray-500/20", label: "변경" };
  }
};

export const HistoryTabContent = ({ sortedHistory, sortedActionHistory }: HistoryTabContentProps) => (
  <div className="space-y-4">
    {/* 액션 히스토리 */}
    <div className="space-y-2">
      {sortedActionHistory.length > 0 ? (
        sortedActionHistory.map((action) => {
          const { icon: Icon, color, bg, label } = getActionInfo(action.actionType);
          return (
            <div
              key={action.id}
              className="flex items-center gap-3 bg-gray-700/20 rounded-lg px-4 py-3 border border-gray-600/20"
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${color}`}>{label}</span>
                  {action.previousStatus && action.newStatus && (
                    <span className="text-[10px] text-gray-500">
                      {action.previousStatus} → {action.newStatus}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-500">
                  {formatDateTime(action.createdAt)}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
          히스토리가 없습니다
        </div>
      )}
    </div>

    {/* 실행 히스토리 (구분선) */}
    {sortedHistory.length > 0 && (
      <>
        <div className="flex items-center gap-2 pt-2">
          <div className="h-px flex-1 bg-gray-700/50" />
          <span className="text-[10px] text-gray-500 px-2">실행 기록</span>
          <div className="h-px flex-1 bg-gray-700/50" />
        </div>
        <div className="space-y-2">
          {sortedHistory.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between bg-gray-700/20 rounded-lg px-4 py-3 border border-gray-600/20"
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-2 h-2 rounded-full
                  ${run.endType === "completed" ? "bg-green-500" :
                    run.endType === "paused" ? "bg-yellow-500" :
                    run.endType === "timeout" ? "bg-red-500" : "bg-gray-500"
                  }
                `} />
                <div>
                  <div className="text-sm text-gray-300">
                    {formatDateTime(run.startedAt)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {run.endType === "completed" ? "완료" :
                     run.endType === "paused" ? "일시정지" :
                     run.endType === "timeout" ? "시간 초과" : "중단됨"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-gray-300">
                  {formatMinutes(Math.floor(run.duration / 60))}
                </div>
                <div className="text-[10px] text-gray-500">
                  소요 시간
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);



