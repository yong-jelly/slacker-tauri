import { useState, useEffect, useRef } from "react";

interface UseModifierHoldOptions {
  triggerKey?: string; // 감지할 키 (기본값: Meta)
  delay?: number; // 홀드 인식 딜레이 (ms)
}

export const useModifierHold = ({
  triggerKey = "Meta",
  delay = 500,
}: UseModifierHoldOptions = {}) => {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<Timer | null>(null);
  const isKeyPressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 이미 홀드 중이거나 타이머가 돌고 있으면 무시
      if (isKeyPressedRef.current) {
        // 다른 키가 눌리면 즉시 취소 (조합키 사용 시 오버레이 방지)
        if (e.key !== triggerKey && timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
          setIsHolding(false);
        }
        return;
      }

      if (e.key === triggerKey) {
        isKeyPressedRef.current = true;
        
        // 타이머 시작
        timerRef.current = setTimeout(() => {
          setIsHolding(true);
        }, delay);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === triggerKey) {
        isKeyPressedRef.current = false;
        
        // 타이머 취소
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        
        setIsHolding(false);
      }
    };

    // 창 포커스 잃을 때 초기화
    const handleBlur = () => {
      isKeyPressedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsHolding(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [triggerKey, delay]);

  return { isHolding };
};
