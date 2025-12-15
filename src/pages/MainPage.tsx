import { useState, useCallback, useEffect } from "react";
import { Task, TaskStatus, TaskPriority, TaskMemo, TaskNote, TimeExtensionHistory } from "@entities/task";
import { TaskSection, AppLayout } from "@widgets";
import { openTaskWindow } from "@shared/lib/openTaskWindow";
import { requestNotificationPermission, sendTaskCompletedNotification } from "@shared/lib/notification";

export const MainPage = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  // 앱 시작 시 알림 권한 요청
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Mock 데이터 - 다양한 상태와 진행률, 히스토리 포함
  const [tasks, setTasks] = useState<Task[]>([
    // INBOX - 시작 전
    {
      id: "1",
      title: "피드백 기능 추가",
      priority: TaskPriority.HIGH,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      expectedDuration: 15,
      createdAt: new Date(),
      targetDate: new Date(),
      tags: ["프론트엔드", "기능"],
      isImportant: true,
      memos: [
        { id: "m1", content: "디자인 확인 후 진행", createdAt: new Date(Date.now() - 7200000) },
      ],
    },
    {
      id: "2",
      title: "타이머 추가",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      expectedDuration: 10,
      createdAt: new Date(),
      targetDate: new Date(),
      tags: ["UI"],
    },
    {
      id: "6",
      title: "데이터베이스 마이그레이션",
      priority: TaskPriority.HIGH,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      expectedDuration: 60,
      createdAt: new Date(),
      targetDate: new Date(Date.now() + 86400000), // 내일
      tags: ["백엔드", "DB"],
      isImportant: true,
      notes: [
        { id: "note1", title: "마이그레이션 계획", content: "1. 백업\n2. 스키마 변경\n3. 데이터 이전\n4. 검증", createdAt: new Date() },
      ],
    },
    // INBOX - 일부 진행됨 (이전에 작업했다가 멈춘 상태)
    {
      id: "10",
      title: "API 연동 작업",
      priority: TaskPriority.HIGH,
      status: TaskStatus.INBOX,
      totalTimeSpent: 8,
      expectedDuration: 20,
      createdAt: new Date(),
      targetDate: new Date(),
      lastRunAt: new Date(Date.now() - 3600000), // 1시간 전
      tags: ["API"],
      memos: [
        { id: "m2", content: "인증 토큰 갱신 로직 확인 필요", createdAt: new Date(Date.now() - 3600000) },
        { id: "m3", content: "에러 핸들링 추가됨", createdAt: new Date(Date.now() - 1800000) },
      ],
      runHistory: [
        { id: "r1", startedAt: new Date(Date.now() - 7200000), endedAt: new Date(Date.now() - 5400000), duration: 1800, endType: "paused" },
        { id: "r2", startedAt: new Date(Date.now() - 3600000), endedAt: new Date(Date.now() - 3000000), duration: 600, endType: "paused" },
      ],
    },
    {
      id: "14",
      title: "UI 컴포넌트 리팩토링",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.INBOX,
      totalTimeSpent: 15,
      expectedDuration: 30,
      createdAt: new Date(),
      targetDate: new Date(),
      lastRunAt: new Date(Date.now() - 600000), // 10분 전
      tags: ["리팩토링", "컴포넌트"],
      runHistory: [
        { id: "r3", startedAt: new Date(Date.now() - 86400000), endedAt: new Date(Date.now() - 84600000), duration: 1800, endType: "timeout" },
      ],
    },
    // INBOX - 일부 진행됨 (이전에 작업했다가 멈춘 상태)
    {
      id: "7",
      title: "API 문서 작성",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.INBOX,
      totalTimeSpent: 12,
      expectedDuration: 30,
      createdAt: new Date(),
      targetDate: new Date(),
      lastRunAt: new Date(Date.now() - 86400000), // 어제
      tags: ["문서"],
      runHistory: [
        { id: "r4", startedAt: new Date(Date.now() - 86400000), endedAt: new Date(Date.now() - 85680000), duration: 720, endType: "paused" },
      ],
    },
    {
      id: "8",
      title: "성능 최적화",
      priority: TaskPriority.LOW,
      status: TaskStatus.INBOX,
      totalTimeSpent: 5,
      expectedDuration: 45,
      createdAt: new Date(),
      targetDate: new Date(Date.now() + 172800000), // 2일 후
      tags: ["최적화"],
    },
    {
      id: "9",
      title: "테스트 코드 작성",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.INBOX,
      totalTimeSpent: 0,
      expectedDuration: 25,
      createdAt: new Date(),
      targetDate: new Date(Date.now() - 172800000), // 2일 전 (지연됨)
      tags: ["테스트"],
    },
    // PAUSED - 일시정지됨
    {
      id: "11",
      title: "Slack 연동 구현",
      priority: TaskPriority.HIGH,
      status: TaskStatus.PAUSED,
      totalTimeSpent: 25,
      expectedDuration: 40,
      createdAt: new Date(),
      lastPausedAt: new Date(),
      lastRunAt: new Date(Date.now() - 1800000), // 30분 전
      targetDate: new Date(),
      tags: ["Slack", "연동"],
      memos: [
        { id: "m4", content: "OAuth 권한 확인 중", createdAt: new Date(Date.now() - 1800000) },
      ],
      notes: [
        { id: "note2", title: "Slack API 연동 가이드", content: "1. OAuth 앱 생성\n2. 권한 설정\n3. 토큰 발급\n4. 메시지 전송 테스트", createdAt: new Date(Date.now() - 86400000) },
      ],
      runHistory: [
        { id: "r5", startedAt: new Date(Date.now() - 3600000), endedAt: new Date(Date.now() - 1800000), duration: 1800, endType: "paused" },
      ],
      isImportant: true,
    },
    {
      id: "12",
      title: "사용자 인증 로직 수정",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PAUSED,
      totalTimeSpent: 15,
      expectedDuration: 30,
      createdAt: new Date(),
      lastPausedAt: new Date(),
      lastRunAt: new Date(Date.now() - 7200000), // 2시간 전
      targetDate: new Date(),
      tags: ["인증"],
      runHistory: [
        { id: "r6", startedAt: new Date(Date.now() - 10800000), endedAt: new Date(Date.now() - 7200000), duration: 3600, endType: "paused" },
      ],
    },
    {
      id: "13",
      title: "대시보드 UI 개선",
      priority: TaskPriority.LOW,
      status: TaskStatus.PAUSED,
      totalTimeSpent: 10,
      expectedDuration: 20,
      createdAt: new Date(),
      lastPausedAt: new Date(),
      lastRunAt: new Date(Date.now() - 86400000), // 어제
      targetDate: new Date(Date.now() - 86400000), // 어제 (지연됨)
      tags: ["UI", "대시보드"],
      memos: [
        { id: "m5", content: "그래프 컴포넌트 수정 필요", createdAt: new Date(Date.now() - 86400000) },
      ],
    },
    // COMPLETED - 완료됨
    {
      id: "3",
      title: "앱 홍보 이미지 제작",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      totalTimeSpent: 120,
      expectedDuration: 60,
      createdAt: new Date(),
      completedAt: new Date(),
      tags: ["디자인"],
      runHistory: [
        { id: "r7", startedAt: new Date(Date.now() - 172800000), endedAt: new Date(Date.now() - 165600000), duration: 7200, endType: "completed" },
      ],
    },
    {
      id: "4",
      title: "CSS 레이아웃",
      priority: TaskPriority.LOW,
      status: TaskStatus.COMPLETED,
      totalTimeSpent: 45,
      expectedDuration: 30,
      createdAt: new Date(),
      completedAt: new Date(),
      tags: ["CSS"],
    },
    {
      id: "5",
      title: "로그인 페이지 구현",
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      totalTimeSpent: 90,
      expectedDuration: 45,
      createdAt: new Date(),
      completedAt: new Date(),
      tags: ["인증", "페이지"],
      notes: [
        { id: "note3", title: "구현 완료 노트", content: "- 로그인 폼 완성\n- 유효성 검사 추가\n- 에러 처리 완료", createdAt: new Date(Date.now() - 86400000) },
      ],
    },
  ]);

  // 상태별 태스크 필터링 (4개 섹션)
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS);
  const pausedTasks = tasks.filter((t) => t.status === TaskStatus.PAUSED);
  const inboxTasks = tasks.filter((t) => t.status === TaskStatus.INBOX);
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);

  // 상태 변경 핸들러
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        
        // 완료 상태로 변경 시 알림 전송
        if (newStatus === TaskStatus.COMPLETED && t.status !== TaskStatus.COMPLETED) {
          sendTaskCompletedNotification(t.title, t.expectedDuration);
        }
        
        return {
          ...t,
          status: newStatus,
          lastPausedAt: newStatus === TaskStatus.PAUSED ? new Date() : t.lastPausedAt,
          completedAt: newStatus === TaskStatus.COMPLETED ? new Date() : t.completedAt,
        };
      })
    );
  };

  const handleTaskSelect = async (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await openTaskWindow(task);
    }
  };

  // 짧은 메모 추가 핸들러
  const handleAddMemo = useCallback((taskId: string, memo: TaskMemo) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, memos: [...(t.memos || []), memo] }
          : t
      )
    );
  }, []);

  // 긴 노트 추가 핸들러
  const handleAddNote = useCallback((taskId: string, note: TaskNote) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, notes: [...(t.notes || []), note] }
          : t
      )
    );
  }, []);

  // 태그 추가 핸들러
  const handleAddTag = useCallback((taskId: string, tag: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId && !t.tags?.includes(tag)
          ? { ...t, tags: [...(t.tags || []), tag] }
          : t
      )
    );
  }, []);

  // 태그 제거 핸들러
  const handleRemoveTag = useCallback((taskId: string, tag: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, tags: t.tags?.filter((tg) => tg !== tag) }
          : t
      )
    );
  }, []);

  // 중요 표시 토글 핸들러
  const handleToggleImportant = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, isImportant: !t.isImportant }
          : t
      )
    );
  }, []);

  // 삭제 핸들러
  const handleDelete = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // 목표일 변경 핸들러
  const handleTargetDateChange = useCallback((taskId: string, date: Date) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, targetDate: date }
          : t
      )
    );
  }, []);

  // 보관함으로 이동 핸들러
  const handleArchive = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: TaskStatus.ARCHIVED }
          : t
      )
    );
  }, []);

  // 시간 추가 핸들러
  const handleExtendTime = useCallback((taskId: string, extension: TimeExtensionHistory) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              expectedDuration: extension.newDuration,
              timeExtensions: [...(t.timeExtensions || []), extension],
            }
          : t
      )
    );
  }, []);

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* 진행중 섹션 */}
          <TaskSection
            title="진행중"
            count={inProgressTasks.length}
            tasks={inProgressTasks}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onStatusChange={handleStatusChange}
            onAddMemo={handleAddMemo}
            onAddNote={handleAddNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
            onTargetDateChange={handleTargetDateChange}
            onArchive={handleArchive}
            onExtendTime={handleExtendTime}
            sectionType="inProgress"
          />

          {/* 일시정지 섹션 */}
          <TaskSection
            title="일시정지"
            count={pausedTasks.length}
            tasks={pausedTasks}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onStatusChange={handleStatusChange}
            onAddMemo={handleAddMemo}
            onAddNote={handleAddNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
            onTargetDateChange={handleTargetDateChange}
            onArchive={handleArchive}
            onExtendTime={handleExtendTime}
            sectionType="paused"
          />

          {/* 할일 섹션 */}
          <TaskSection
            title="할일"
            count={inboxTasks.length}
            tasks={inboxTasks}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onStatusChange={handleStatusChange}
            onAddMemo={handleAddMemo}
            onAddNote={handleAddNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
            onTargetDateChange={handleTargetDateChange}
            onArchive={handleArchive}
            onExtendTime={handleExtendTime}
            sectionType="inbox"
          />

          {/* 완료 섹션 */}
          <TaskSection
            title="완료"
            count={completedTasks.length}
            tasks={completedTasks}
            selectedTaskId={undefined}
            onTaskSelect={undefined}
            onStatusChange={handleStatusChange}
            onAddMemo={handleAddMemo}
            onAddNote={handleAddNote}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
            onTargetDateChange={handleTargetDateChange}
            onArchive={handleArchive}
            onExtendTime={handleExtendTime}
            sectionType="completed"
          />
        </div>
      </div>
    </AppLayout>
  );
};
