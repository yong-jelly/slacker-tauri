import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

/**
 * 앱 버전을 가져오는 훅
 * Cargo.toml의 버전을 Tauri API를 통해 가져옵니다.
 */
export function useAppVersion(): string {
  const [version, setVersion] = useState<string>("0.1.0");

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {
        // Tauri 환경이 아닐 경우 기본값 사용
        setVersion("0.1.0");
      });
  }, []);

  return version;
}

