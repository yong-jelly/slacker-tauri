import { motion } from "motion/react";

/**
 * 진행 중인 태스크의 랜덤 외곽 라인 플래시 이펙트 컴포넌트
 * - 빛이 테두리를 따라 흐르는 효과
 */
export const TaskItemBorderEffect = () => {
  return (
    <motion.div
      className="absolute -inset-[6px] rounded-[18px] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* 글로우 레이어 - 빛이 흐르는 효과 */}
      <motion.div
        className="absolute inset-0 rounded-[18px]"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, transparent 70%, #ff00ff 78%, #00ffff 82%, #ffff00 86%, #ff0000 90%, transparent 95%, transparent 100%)",
          filter: "blur(8px)",
          opacity: 0.8,
        }}
        initial={{ rotate: -90 }}
        animate={{ rotate: 270 }}
        exit={{ rotate: 270, opacity: 0 }}
        transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
      />
      
      {/* 선명한 외곽선 레이어 */}
      <motion.div
        className="absolute inset-[5px] rounded-xl"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, transparent 65%, #ff00ff 75%, #00ffff 80%, #ffff00 85%, #00ff00 88%, #ff0000 92%, transparent 97%, transparent 100%)",
        }}
        initial={{ rotate: -90 }}
        animate={{ rotate: 270 }}
        exit={{ rotate: 270 }}
        transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
      />
      
      {/* 빛 꼬리 효과 */}
      <motion.div
        className="absolute inset-[4px] rounded-[14px]"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.4) 80%, rgba(255,255,255,0.1) 90%, transparent 95%, transparent 100%)",
          filter: "blur(3px)",
        }}
        initial={{ rotate: -90 }}
        animate={{ rotate: 270 }}
        exit={{ rotate: 270, opacity: 0 }}
        transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
      />
      
      {/* 내부 마스크 - 모든 효과 위에서 내부를 완전히 덮음 */}
      <div 
        className="absolute inset-[6px] rounded-xl bg-[#2B2D31]"
        style={{ 
          boxShadow: "0 0 0 2px #2B2D31",
        }}
      />
    </motion.div>
  );
};

