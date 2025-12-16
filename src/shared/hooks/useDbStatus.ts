import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface DbStatus {
  configured: boolean;
  path: string;
  exists: boolean;
  sizeBytes?: number;
  tables: string[];
}

export function useDbStatus() {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<DbStatus>("get_db_status");
      setStatus(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const initDb = useCallback(async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<DbStatus>("init_db", { path });
      setStatus(result);
      return result;
    } catch (e) {
      setError(String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExistingDb = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<DbStatus>("load_existing_db", { path });
      setStatus(result);
      return result;
    } catch (e) {
      setError(String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await invoke("logout");
      setStatus(null);
    } catch (e) {
      setError(String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    status,
    loading,
    error,
    refresh,
    initDb,
    loadExistingDb,
    logout,
  };
}

