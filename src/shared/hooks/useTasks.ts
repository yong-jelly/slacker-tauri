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
    targetDate: raw.targetDate ? new Date(raw.targetDate) : undefined,
    isImportant: raw.isImportant,
    createdAt: new Date(raw.createdAt),
    completedAt: raw.completedAt ? new Date(raw.completedAt) : undefined,
    lastPausedAt: raw.lastPausedAt ? new Date(raw.lastPausedAt) : undefined,
    lastRunAt: raw.lastRunAt ? new Date(raw.lastRunAt) : undefined,
    tags: raw.tags,
    memos: raw.memos.map(m => ({
      id: m.id,
      content: m.content,
      createdAt: new Date(m.createdAt),
    })),
    notes: raw.notes.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      createdAt: new Date(n.createdAt),
      updatedAt: n.updatedAt ? new Date(n.updatedAt) : undefined,
    })),
    runHistory: raw.runHistory.map(r => ({
      id: r.id,
      startedAt: new Date(r.startedAt),
      endedAt: r.endedAt ? new Date(r.endedAt) : undefined,
      duration: r.duration,
      endType: r.endType as TaskRunHistory["endType"],
    })),
    timeExtensions: raw.timeExtensions.map(t => ({
      id: t.id,
      addedMinutes: t.addedMinutes,
      previousDuration: t.previousDuration,
      newDuration: t.newDuration,
      reason: t.reason,
      createdAt: new Date(t.createdAt),
    })),
    actionHistory: raw.actionHistory.map(a => ({
      id: a.id,
      actionType: a.actionType as TaskActionHistory["actionType"],
      previousStatus: a.previousStatus,
      newStatus: a.newStatus,
      metadata: a.metadata,
      createdAt: new Date(a.createdAt),
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

