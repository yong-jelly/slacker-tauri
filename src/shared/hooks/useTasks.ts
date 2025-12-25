import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TaskStatus, TaskPriority, Task, TaskMemo, TaskNote, TaskRunHistory, TaskActionHistory } from "@entities/task";

/** 백엔드에서 받아오는 Task 원시 타입 (날짜가 문자열) */
interface TaskRaw {
  id: string;
  title: string;
  description?: string;
  url?: string;
  slackMessageId?: string;
  priority: string;
  status: string;
  totalTimeSpent: number;
  expectedDuration?: number;
  remainingTimeSeconds?: number;
  targetDate?: string;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  lastPausedAt?: string;
  lastRunAt?: string;
  tags: string[];
  memos: { id: string; taskId: string; content: string; createdAt: string }[];
  notes: { id: string; taskId: string; title: string; content: string; createdAt: string; updatedAt: string }[];
  runHistory: { id: string; taskId: string; startedAt: string; endedAt?: string; duration: number; endType: string }[];
  timeExtensions: { id: string; taskId: string; addedMinutes: number; previousDuration: number; newDuration: number; reason?: string; createdAt: string }[];
  actionHistory: { id: string; taskId: string; actionType: string; previousStatus?: string; newStatus?: string; metadata?: string; createdAt: string }[];
}

/**
 * SQLite의 datetime('now')로 저장된 UTC 시간 문자열을 로컬 Date 객체로 변환
 * 
 * SQLite는 UTC 시간을 "YYYY-MM-DD HH:MM:SS" 형식으로 저장합니다.
 * JavaScript의 new Date()는 이 형식을 로컬 시간으로 해석하므로,
 * UTC임을 명시하기 위해 "Z" suffix를 추가해야 합니다.
 * 
 * @param dateStr - SQLite에서 받은 날짜 문자열 (UTC 시간)
 * @returns 로컬 시간대로 변환된 Date 객체
 */
function parseUTCDateString(dateStr: string): Date {
  // 이미 ISO 8601 형식이거나 시간대 정보가 있으면 그대로 파싱
  if (dateStr.endsWith('Z') || dateStr.includes('+') || /\d{2}:\d{2}$/.test(dateStr) === false) {
    // 마지막 조건: 시간대 오프셋이 있는지 확인 (예: +09:00, -05:00)
    const hasTimezone = /[+-]\d{2}:\d{2}$/.test(dateStr);
    if (dateStr.endsWith('Z') || hasTimezone) {
      return new Date(dateStr);
    }
  }
  
  // SQLite의 "YYYY-MM-DD HH:MM:SS" 형식을 ISO 8601 UTC 형식으로 변환
  // 공백을 'T'로 바꾸고 끝에 'Z'를 추가하여 UTC임을 명시
  const isoString = dateStr.replace(' ', 'T') + 'Z';
  return new Date(isoString);
}

/** 원시 Task를 프론트엔드 Task 타입으로 변환 */
function parseTask(raw: TaskRaw): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    url: raw.url,
    slackMessageId: raw.slackMessageId,
    priority: raw.priority as TaskPriority,
    status: raw.status as TaskStatus,
    totalTimeSpent: raw.totalTimeSpent,
    expectedDuration: raw.expectedDuration,
    remainingTimeSeconds: raw.remainingTimeSeconds,
    // targetDate는 날짜만 있으므로 그대로 파싱 (시간대 영향 없음)
    targetDate: raw.targetDate ? new Date(raw.targetDate) : undefined,
    isImportant: raw.isImportant,
    // SQLite UTC 시간 문자열을 로컬 Date 객체로 변환
    createdAt: parseUTCDateString(raw.createdAt),
    completedAt: raw.completedAt ? parseUTCDateString(raw.completedAt) : undefined,
    lastPausedAt: raw.lastPausedAt ? parseUTCDateString(raw.lastPausedAt) : undefined,
    lastRunAt: raw.lastRunAt ? parseUTCDateString(raw.lastRunAt) : undefined,
    tags: raw.tags,
    memos: raw.memos.map(m => ({
      id: m.id,
      content: m.content,
      createdAt: parseUTCDateString(m.createdAt),
    })),
    notes: raw.notes.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      createdAt: parseUTCDateString(n.createdAt),
      updatedAt: n.updatedAt ? parseUTCDateString(n.updatedAt) : undefined,
    })),
    runHistory: raw.runHistory.map(r => ({
      id: r.id,
      startedAt: parseUTCDateString(r.startedAt),
      endedAt: r.endedAt ? parseUTCDateString(r.endedAt) : undefined,
      duration: r.duration,
      endType: r.endType as TaskRunHistory["endType"],
    })),
    timeExtensions: raw.timeExtensions.map(t => ({
      id: t.id,
      addedMinutes: t.addedMinutes,
      previousDuration: t.previousDuration,
      newDuration: t.newDuration,
      reason: t.reason,
      createdAt: parseUTCDateString(t.createdAt),
    })),
    actionHistory: raw.actionHistory.map(a => ({
      id: a.id,
      actionType: a.actionType as TaskActionHistory["actionType"],
      previousStatus: a.previousStatus,
      newStatus: a.newStatus,
      metadata: a.metadata,
      createdAt: parseUTCDateString(a.createdAt),
    })),
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  url?: string;
  priority?: TaskPriority;
  expectedDuration?: number;
  targetDate?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  url?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  totalTimeSpent?: number;
  expectedDuration?: number;
  remainingTimeSeconds?: number;
  targetDate?: string;
  isImportant?: boolean;
  completedAt?: string;
  lastPausedAt?: string;
  lastRunAt?: string;
}

export interface ExtendTimeInput {
  taskId: string;
  addedMinutes: number;
  previousDuration: number;
  newDuration: number;
  reason?: string;
}

export interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refresh: (status?: TaskStatus) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<string>;
  updateTask: (input: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addMemo: (taskId: string, content: string) => Promise<TaskMemo>;
  addNote: (taskId: string, title: string, content: string) => Promise<TaskNote>;
  updateNote: (noteId: string, content: string) => Promise<TaskNote>;
  addTag: (taskId: string, tag: string) => Promise<void>;
  removeTag: (taskId: string, tag: string) => Promise<void>;
  startRun: (taskId: string) => Promise<string>;
  endRun: (runId: string, endType: string, duration: number) => Promise<void>;
  extendTime: (input: ExtendTimeInput) => Promise<void>;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (status?: TaskStatus) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<TaskRaw[]>("list_tasks", { status });
      setTasks(result.map(parseTask));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (input: CreateTaskInput): Promise<string> => {
    const id = await invoke<string>("create_task", { input });
    await refresh();
    return id;
  }, [refresh]);

  const updateTask = useCallback(async (input: UpdateTaskInput): Promise<void> => {
    await invoke("update_task", { input });
    await refresh();
  }, [refresh]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await invoke("delete_task", { id });
    await refresh();
  }, [refresh]);

  const addMemo = useCallback(async (taskId: string, content: string): Promise<TaskMemo> => {
    const result = await invoke<{ id: string; taskId: string; content: string; createdAt: string }>(
      "add_task_memo",
      { taskId, content }
    );
    await refresh();
    return {
      id: result.id,
      content: result.content,
      createdAt: new Date(result.createdAt),
    };
  }, [refresh]);

  const addNote = useCallback(async (taskId: string, title: string, content: string): Promise<TaskNote> => {
    const result = await invoke<{ id: string; taskId: string; title: string; content: string; createdAt: string; updatedAt: string }>(
      "add_task_note",
      { taskId, title, content }
    );
    await refresh();
    return {
      id: result.id,
      title: result.title,
      content: result.content,
      createdAt: new Date(result.createdAt),
      updatedAt: result.updatedAt ? new Date(result.updatedAt) : undefined,
    };
  }, [refresh]);

  const updateNote = useCallback(async (noteId: string, content: string): Promise<TaskNote> => {
    const result = await invoke<{ id: string; taskId: string; title: string; content: string; createdAt: string; updatedAt: string }>(
      "update_task_note",
      { noteId, content }
    );
    await refresh();
    return {
      id: result.id,
      title: result.title,
      content: result.content,
      createdAt: new Date(result.createdAt),
      updatedAt: result.updatedAt ? new Date(result.updatedAt) : undefined,
    };
  }, [refresh]);

  const addTag = useCallback(async (taskId: string, tag: string): Promise<void> => {
    await invoke("add_task_tag", { taskId, tag });
    await refresh();
  }, [refresh]);

  const removeTag = useCallback(async (taskId: string, tag: string): Promise<void> => {
    await invoke("remove_task_tag", { taskId, tag });
    await refresh();
  }, [refresh]);

  const startRun = useCallback(async (taskId: string): Promise<string> => {
    const runId = await invoke<string>("start_task_run", { taskId });
    return runId;
  }, []);

  const endRun = useCallback(async (runId: string, endType: string, duration: number): Promise<void> => {
    await invoke("end_task_run", { runId, endType, duration });
    await refresh();
  }, [refresh]);

  const extendTime = useCallback(async (input: ExtendTimeInput): Promise<void> => {
    await invoke("extend_task_time", { input });
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    tasks,
    loading,
    error,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    addMemo,
    addNote,
    updateNote,
    addTag,
    removeTag,
    startRun,
    endRun,
    extendTime,
  };
}

