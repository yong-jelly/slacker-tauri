use serde::{Deserialize, Serialize};

/// DB 상태 정보
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbStatus {
    pub configured: bool,
    pub path: String,
    pub exists: bool,
    pub size_bytes: Option<u64>,
    pub tables: Vec<String>,
}

/// Task 우선순위
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
}

impl Default for TaskPriority {
    fn default() -> Self {
        Self::Medium
    }
}

impl std::fmt::Display for TaskPriority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Low => write!(f, "LOW"),
            Self::Medium => write!(f, "MEDIUM"),
            Self::High => write!(f, "HIGH"),
        }
    }
}

impl From<&str> for TaskPriority {
    fn from(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "LOW" => Self::Low,
            "HIGH" => Self::High,
            _ => Self::Medium,
        }
    }
}

/// Task 상태
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaskStatus {
    Inbox,
    InProgress,
    Paused,
    Completed,
    Archived,
}

impl Default for TaskStatus {
    fn default() -> Self {
        Self::Inbox
    }
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Inbox => write!(f, "INBOX"),
            Self::InProgress => write!(f, "IN_PROGRESS"),
            Self::Paused => write!(f, "PAUSED"),
            Self::Completed => write!(f, "COMPLETED"),
            Self::Archived => write!(f, "ARCHIVED"),
        }
    }
}

impl From<&str> for TaskStatus {
    fn from(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "IN_PROGRESS" => Self::InProgress,
            "PAUSED" => Self::Paused,
            "COMPLETED" => Self::Completed,
            "ARCHIVED" => Self::Archived,
            _ => Self::Inbox,
        }
    }
}

/// Task 메모
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskMemo {
    pub id: String,
    pub task_id: String,
    pub content: String,
    pub created_at: String,
}

/// Task 노트
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskNote {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Task 실행 히스토리
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRunHistory {
    pub id: String,
    pub task_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration: i64,
    pub end_type: String,
}

/// Task 시간 추가 히스토리
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskTimeExtension {
    pub id: String,
    pub task_id: String,
    pub added_minutes: i64,
    pub previous_duration: i64,
    pub new_duration: i64,
    pub reason: Option<String>,
    pub created_at: String,
}

/// Task 액션 히스토리 (모든 상태 변경 기록)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskActionHistory {
    pub id: String,
    pub task_id: String,
    pub action_type: String,
    pub previous_status: Option<String>,
    pub new_status: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
}

/// Task 전체 데이터 (관계 포함)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub url: Option<String>,
    pub slack_message_id: Option<String>,
    pub priority: TaskPriority,
    pub status: TaskStatus,
    pub total_time_spent: i64,
    pub expected_duration: Option<i64>,
    /// 일시정지 시 저장된 남은 시간 (초)
    pub remaining_time_seconds: Option<i64>,
    pub target_date: Option<String>,
    pub is_important: bool,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
    pub last_paused_at: Option<String>,
    pub last_run_at: Option<String>,
    // 관계 데이터
    pub tags: Vec<String>,
    pub memos: Vec<TaskMemo>,
    pub notes: Vec<TaskNote>,
    pub run_history: Vec<TaskRunHistory>,
    pub time_extensions: Vec<TaskTimeExtension>,
    pub action_history: Vec<TaskActionHistory>,
}

/// Task 생성 입력
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskInput {
    pub title: String,
    pub description: Option<String>,
    pub url: Option<String>,
    pub priority: Option<TaskPriority>,
    pub expected_duration: Option<i64>,
    pub target_date: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// Task 수정 입력
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub url: Option<String>,
    pub priority: Option<TaskPriority>,
    pub status: Option<TaskStatus>,
    pub total_time_spent: Option<i64>,
    pub expected_duration: Option<i64>,
    /// 일시정지 시 저장된 남은 시간 (초)
    pub remaining_time_seconds: Option<i64>,
    pub target_date: Option<String>,
    pub is_important: Option<bool>,
    pub completed_at: Option<String>,
    pub last_paused_at: Option<String>,
    pub last_run_at: Option<String>,
}

/// 시간 추가 입력
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtendTimeInput {
    pub task_id: String,
    pub added_minutes: i64,
    pub previous_duration: i64,
    pub new_duration: i64,
    pub reason: Option<String>,
}

/// 앱 설정
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Setting {
    pub id: String,
    pub key: String,
    pub value: Option<String>,
    pub updated_at: String,
}

/// 테이블 행 (제네릭 조회용)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableRow {
    pub columns: Vec<String>,
    pub values: Vec<serde_json::Value>,
}

/// 앱 설정 파일 (config.json)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub db_path: Option<String>,
    pub theme: Option<String>,
    pub language: Option<String>,
}

