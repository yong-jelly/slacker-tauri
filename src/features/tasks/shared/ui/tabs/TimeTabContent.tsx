import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { TimeExtensionHistory } from "@entities/task";
import { formatDateTime } from "../../lib/timeFormat";

export interface TimeTabContentProps {
  expectedDurationText: string;
  sortedTimeExtensions: TimeExtensionHistory[];
  timeExtendMinutes: number;
  onTimeExtendMinutesChange: (value: number) => void;
  onExtendTime: (e: React.FormEvent) => void;
}

export const TimeTabContent = ({
  expectedDurationText,
  sortedTimeExtensions,
  timeExtendMinutes,
  onTimeExtendMinutesChange,
  onExtendTime,
}: TimeTabContentProps) => {
  const handleAddTime = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const formEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
    } as React.FormEvent;
    onExtendTime(formEvent);
  };

  return (
    <div className="space-y-4">
      {/* 현재 예상 시간 정보 */}
      <div className="bg-gray-700/20 rounded-lg px-4 py-3 border border-gray-600/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">현재 예상 시간</span>
          <span className="text-lg font-bold text-gray-200">{expectedDurationText}</span>
        </div>
        {sortedTimeExtensions.length > 0 && (
          <div className="text-[10px] text-gray-500">
            총 {sortedTimeExtensions.reduce((sum, e) => sum + e.addedMinutes, 0)}분 추가됨
          </div>
        )}
      </div>

      {/* 시간 추가 폼 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">시간:</span>
        <div className="flex items-center gap-1">
          {[5, 10, 15, 30, 60].map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => onTimeExtendMinutesChange(min)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                timeExtendMinutes === min
                  ? "bg-[#FF6B00] text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50"
              }`}
            >
              {min >= 60 ? `${min / 60}시간` : `${min}분`}
            </button>
          ))}
        </div>
        <motion.button
          type="button"
          onClick={handleAddTime}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 text-white bg-[#FF6B00] hover:bg-[#FF8A3D]"
        >
          <Plus className="w-3 h-3" />
          추가
        </motion.button>
      </div>

    {/* 시간 추가 히스토리 */}
    {sortedTimeExtensions.length > 0 ? (
      <div className="space-y-2 pt-4 border-t border-gray-700/30">
        <div className="text-xs text-gray-500 mb-2">시간 추가 기록</div>
        {sortedTimeExtensions.map((ext) => (
          <div
            key={ext.id}
            className="flex items-center justify-between bg-gray-700/20 rounded-lg px-4 py-3 border border-gray-600/20"
          >
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Plus className="w-3 h-3 text-green-500" />
                <span className="font-medium text-green-400">+{ext.addedMinutes}분</span>
                <span className="text-gray-500">
                  ({ext.previousDuration}분 → {ext.newDuration}분)
                </span>
              </div>
            </div>
            <div className="text-[10px] text-gray-500">
              {formatDateTime(ext.createdAt)}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-4 text-gray-500 text-sm">
        아직 시간 추가 기록이 없습니다
      </div>
    )}
    </div>
  );
};

