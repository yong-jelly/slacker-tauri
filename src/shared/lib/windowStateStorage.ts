/**
 * 일반 모드 창 상태 저장/불러오기
 * 위젯 모드 전환 시 현재 창 상태를 저장하고, 복귀 시 복원하기 위한 유틸리티
 * 프로그램 실행 중에만 메모리에 저장 (재시작 시 초기화)
 */

export interface WindowState {
  size: { width: number; height: number };
  position: { x: number; y: number };
  resizable: boolean;
}

// 기본값: tauri.conf.json의 기본 설정
const defaultState: WindowState = {
  size: { width: 700, height: 800 },
  position: { x: -1, y: -1 }, // -1은 기본 위치 사용
  resizable: true,
};

// 메모리에 저장된 창 상태 (프로그램 실행 중에만 유지)
let savedState: WindowState | null = null;

/**
 * 창 상태 저장
 */
export const saveWindowState = (state: WindowState): void => {
  savedState = { ...state };
};

/**
 * 창 상태 불러오기
 */
export const loadWindowState = (): WindowState | null => {
  return savedState;
};

/**
 * 창 상태 초기화
 */
export const resetWindowState = (): void => {
  savedState = null;
};

/**
 * 기본 창 상태 반환
 */
export const getDefaultWindowState = (): WindowState => {
  return { ...defaultState };
};

