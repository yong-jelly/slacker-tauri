import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface SidebarCounts {
  inbox: number;
  completed: number;
  starred: number;
  today: number;
  tomorrow: number;
  overdue: number;
  archive: number;
}

const defaultCounts: SidebarCounts = {
  inbox: 0,
  completed: 0,
  starred: 0,
  today: 0,
  tomorrow: 0,
  overdue: 0,
  archive: 0,
};

export function useSidebarCounts() {
  const [counts, setCounts] = useState<SidebarCounts>(defaultCounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<SidebarCounts>("get_sidebar_counts");
      setCounts(result);
    } catch (e) {
      setError(String(e));
      setCounts(defaultCounts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { counts, loading, error, refresh };
}

