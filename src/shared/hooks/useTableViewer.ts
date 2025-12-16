import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface TableRow {
  columns: string[];
  values: unknown[];
}

export interface UseTableViewerResult {
  tables: string[];
  selectedTable: string | null;
  rows: TableRow[];
  loading: boolean;
  error: string | null;
  refreshTables: () => Promise<void>;
  selectTable: (tableName: string) => Promise<void>;
  queryTable: (tableName: string, limit?: number, offset?: number) => Promise<TableRow[]>;
}

export function useTableViewer(): UseTableViewerResult {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<string[]>("list_tables");
      setTables(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const queryTable = useCallback(async (tableName: string, limit = 100, offset = 0): Promise<TableRow[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<TableRow[]>("query_table", { tableName, limit, offset });
      return result;
    } catch (e) {
      setError(String(e));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const selectTable = useCallback(async (tableName: string) => {
    setSelectedTable(tableName);
    const result = await queryTable(tableName);
    setRows(result);
  }, [queryTable]);

  useEffect(() => {
    refreshTables();
  }, [refreshTables]);

  return {
    tables,
    selectedTable,
    rows,
    loading,
    error,
    refreshTables,
    selectTable,
    queryTable,
  };
}

