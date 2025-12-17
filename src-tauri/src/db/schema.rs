/// 데이터베이스 스키마 SQL 정의
pub const SCHEMA_SQL: &str = r#"
-- 앱 설정 테이블
CREATE TABLE IF NOT EXISTS tbl_setting (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_setting_key ON tbl_setting(key);

-- Task 메인 테이블
CREATE TABLE IF NOT EXISTS tbl_task (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    slack_message_id TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    status TEXT NOT NULL DEFAULT 'INBOX',
    total_time_spent INTEGER NOT NULL DEFAULT 0,
    expected_duration INTEGER DEFAULT 5,
    remaining_time_seconds INTEGER,
    target_date TEXT,
    is_important INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    last_paused_at TEXT,
    last_run_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_task_status ON tbl_task(status);
CREATE INDEX IF NOT EXISTS idx_task_priority ON tbl_task(priority);
CREATE INDEX IF NOT EXISTS idx_task_target_date ON tbl_task(target_date);
CREATE INDEX IF NOT EXISTS idx_task_is_important ON tbl_task(is_important);

-- Task 태그 테이블
CREATE TABLE IF NOT EXISTS tbl_task_tag (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(task_id) REFERENCES tbl_task(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_task_tag_task_tag ON tbl_task_tag(task_id, tag);
CREATE INDEX IF NOT EXISTS idx_task_tag_tag ON tbl_task_tag(tag);

-- Task 짧은 메모 테이블
CREATE TABLE IF NOT EXISTS tbl_task_memo (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(task_id) REFERENCES tbl_task(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_memo_task_id ON tbl_task_memo(task_id);

-- Task 긴 노트 테이블
CREATE TABLE IF NOT EXISTS tbl_task_note (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(task_id) REFERENCES tbl_task(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_note_task_id ON tbl_task_note(task_id);

-- Task 실행 히스토리 테이블
CREATE TABLE IF NOT EXISTS tbl_task_run_history (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    end_type TEXT NOT NULL,
    FOREIGN KEY(task_id) REFERENCES tbl_task(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_run_history_task_id ON tbl_task_run_history(task_id);

-- Task 시간 추가 히스토리 테이블
CREATE TABLE IF NOT EXISTS tbl_task_time_extension (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    added_minutes INTEGER NOT NULL,
    previous_duration INTEGER NOT NULL,
    new_duration INTEGER NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(task_id) REFERENCES tbl_task(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_time_extension_task_id ON tbl_task_time_extension(task_id);

-- Task 액션 히스토리 테이블 (모든 상태 변경 기록)
CREATE TABLE IF NOT EXISTS tbl_task_action_history (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(task_id) REFERENCES tbl_task(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_action_history_task_id ON tbl_task_action_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_action_history_action_type ON tbl_task_action_history(action_type);
CREATE INDEX IF NOT EXISTS idx_task_action_history_created_at ON tbl_task_action_history(created_at);
"#;

