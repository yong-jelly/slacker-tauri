import { TaskRunHistory } from "@entities/task";
import { formatDateTime, formatMinutes } from "../../lib/timeFormat";

export interface HistoryTabContentProps {
  sortedHistory: TaskRunHistory[];
}

export const HistoryTabContent = ({ sortedHistory }: HistoryTabContentProps) => (
  <div className="space-y-2">
    {sortedHistory.length > 0 ? (
      sortedHistory.map((run) => (
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
      ))
    ) : (
      <div className="text-center py-8 text-gray-500 text-sm">
        실행 기록이 없습니다
      </div>
    )}
  </div>
);


