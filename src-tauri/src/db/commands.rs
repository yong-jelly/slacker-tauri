use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use rusqlite::Connection;
use serde_json::json;
use tauri::{AppHandle, Manager, State};

use super::migration::{get_table_list, run_migrations};
use super::models::*;

/// DB 연결 상태
pub struct DbState {
    pub db_path: Mutex<Option<PathBuf>>,
}

impl Default for DbState {
    fn default() -> Self {
        Self {
            db_path: Mutex::new(None),
        }
    }
}

// ============================================================================
// 헬퍼 함수들
// ============================================================================

/// config.json 파일 경로
fn config_file(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let mut dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    dir.push("config.json");
    Ok(dir)
}

/// config.json에서 DB 경로 로드
fn load_config_path(app_handle: &AppHandle) -> Result<Option<PathBuf>, String> {
    let file = config_file(app_handle)?;
    if !file.exists() {
        return Ok(None);
    }
    let data = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    let config: AppConfig = serde_json::from_str(&data).unwrap_or_default();
    Ok(config.db_path.map(PathBuf::from))
}

/// config.json에 DB 경로 저장
fn save_config_path(app_handle: &AppHandle, path: &Path) -> Result<(), String> {
    let file = config_file(app_handle)?;
    
    // 기존 설정 로드
    let mut config: AppConfig = if file.exists() {
        let data = fs::read_to_string(&file).map_err(|e| e.to_string())?;
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        AppConfig::default()
    };
    
    config.db_path = Some(path.to_string_lossy().to_string());
    
    let serialized = serde_json::to_vec_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&file, serialized).map_err(|e| e.to_string())
}

/// 기본 DB 경로
fn default_db_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let mut dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    dir.push("storage");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("mirumi.db"))
}

/// DB 연결 획득
fn get_connection(app_handle: &AppHandle, state: &State<DbState>) -> Result<Connection, String> {
    let path = state
        .db_path
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .or_else(|| load_config_path(app_handle).ok().flatten())
        .ok_or_else(|| "DB가 설정되지 않았습니다.".to_string())?;

    if !path.exists() {
        return Err("DB 파일이 존재하지 않습니다.".to_string());
    }

    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| e.to_string())?;
    Ok(conn)
}

/// DB 상태 빌드
fn build_status(path: &Path, configured: bool) -> Result<DbStatus, String> {
    let exists = path.exists();
    let size_bytes = if exists {
        fs::metadata(path).ok().map(|m| m.len())
    } else {
        None
    };

    let tables = if exists {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        get_table_list(&conn)?
    } else {
        vec![]
    };

    Ok(DbStatus {
        configured,
        path: path.to_string_lossy().to_string(),
        exists,
        size_bytes,
        tables,
    })
}

// ============================================================================
// DB 관리 커맨드
// ============================================================================

/// DB 상태 조회
#[tauri::command]
pub fn get_db_status(app_handle: AppHandle, state: State<DbState>) -> Result<DbStatus, String> {
    // 먼저 state에서 확인
    let state_path = state.db_path.lock().map_err(|e| e.to_string())?.clone();
    
    if let Some(path) = state_path {
        // 앱 재시작 시에도 마이그레이션 실행
        if path.exists() {
            let conn = Connection::open(&path).map_err(|e| e.to_string())?;
            run_migrations(&conn)?;
        }
        return build_status(&path, true);
    }

    // config.json에서 확인
    if let Some(path) = load_config_path(&app_handle)? {
        // state 업데이트
        *state.db_path.lock().map_err(|e| e.to_string())? = Some(path.clone());
        
        // 마이그레이션 실행 (기존 DB에 새 컬럼 추가)
        if path.exists() {
            let conn = Connection::open(&path).map_err(|e| e.to_string())?;
            run_migrations(&conn)?;
        }
        
        return build_status(&path, true);
    }

    // 미설정 상태
    let default_path = default_db_path(&app_handle)?;
    Ok(DbStatus {
        configured: false,
        path: default_path.to_string_lossy().to_string(),
        exists: false,
        size_bytes: None,
        tables: vec![],
    })
}

/// 새 DB 초기화
#[tauri::command]
pub fn init_db(
    app_handle: AppHandle,
    state: State<DbState>,
    path: Option<String>,
) -> Result<DbStatus, String> {
    let db_path = path
        .map(PathBuf::from)
        .unwrap_or_else(|| default_db_path(&app_handle).unwrap());

    // 부모 디렉토리 생성
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // DB 생성 및 마이그레이션
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    run_migrations(&conn)?;

    // 설정 저장
    save_config_path(&app_handle, &db_path)?;
    *state.db_path.lock().map_err(|e| e.to_string())? = Some(db_path.clone());

    build_status(&db_path, true)
}

/// 기존 DB 불러오기
#[tauri::command]
pub fn load_existing_db(
    app_handle: AppHandle,
    state: State<DbState>,
    path: String,
) -> Result<DbStatus, String> {
    let db_path = PathBuf::from(&path);

    if !db_path.exists() {
        return Err("파일이 존재하지 않습니다.".to_string());
    }

    // DB 연결 테스트 및 마이그레이션
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    run_migrations(&conn)?;

    // 설정 저장
    save_config_path(&app_handle, &db_path)?;
    *state.db_path.lock().map_err(|e| e.to_string())? = Some(db_path.clone());

    build_status(&db_path, true)
}

/// 로그아웃 (DB 연결 해제)
#[tauri::command]
pub fn logout(app_handle: AppHandle, state: State<DbState>) -> Result<(), String> {
    *state.db_path.lock().map_err(|e| e.to_string())? = None;
    
    // config.json에서 경로 제거
    let file = config_file(&app_handle)?;
    if file.exists() {
        let data = fs::read_to_string(&file).map_err(|e| e.to_string())?;
        let mut config: AppConfig = serde_json::from_str(&data).unwrap_or_default();
        config.db_path = None;
        let serialized = serde_json::to_vec_pretty(&config).map_err(|e| e.to_string())?;
        fs::write(&file, serialized).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// ============================================================================
// Task CRUD 커맨드
// ============================================================================

/// Task 목록 조회
#[tauri::command]
pub fn list_tasks(
    app_handle: AppHandle,
    state: State<DbState>,
    status: Option<String>,
) -> Result<Vec<Task>, String> {
    let conn = get_connection(&app_handle, &state)?;

    let sql = if status.is_some() {
        "SELECT * FROM tbl_task WHERE status = ?1 ORDER BY is_important DESC, created_at DESC"
    } else {
        "SELECT * FROM tbl_task ORDER BY is_important DESC, created_at DESC"
    };

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let task_iter = if let Some(ref s) = status {
        stmt.query_map([s], map_task_row)
    } else {
        stmt.query_map([], map_task_row)
    }
    .map_err(|e| e.to_string())?;

    let mut tasks = Vec::new();
    for task_result in task_iter {
        let mut task = task_result.map_err(|e| e.to_string())?;
        // 관계 데이터 로드
        task.tags = load_task_tags(&conn, &task.id)?;
        task.memos = load_task_memos(&conn, &task.id)?;
        task.notes = load_task_notes(&conn, &task.id)?;
        task.run_history = load_task_run_history(&conn, &task.id)?;
        task.time_extensions = load_task_time_extensions(&conn, &task.id)?;
        task.action_history = load_task_action_history(&conn, &task.id)?;
        tasks.push(task);
    }

    Ok(tasks)
}

/// Task 단건 조회
#[tauri::command]
pub fn get_task(
    app_handle: AppHandle,
    state: State<DbState>,
    id: String,
) -> Result<Task, String> {
    let conn = get_connection(&app_handle, &state)?;

    let mut stmt = conn
        .prepare("SELECT * FROM tbl_task WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let mut task = stmt
        .query_row([&id], map_task_row)
        .map_err(|e| e.to_string())?;

    task.tags = load_task_tags(&conn, &task.id)?;
    task.memos = load_task_memos(&conn, &task.id)?;
    task.notes = load_task_notes(&conn, &task.id)?;
    task.run_history = load_task_run_history(&conn, &task.id)?;
    task.time_extensions = load_task_time_extensions(&conn, &task.id)?;
    task.action_history = load_task_action_history(&conn, &task.id)?;

    Ok(task)
}

/// Task 생성
#[tauri::command]
pub fn create_task(
    app_handle: AppHandle,
    state: State<DbState>,
    input: CreateTaskInput,
) -> Result<String, String> {
    let conn = get_connection(&app_handle, &state)?;
    let id = uuid::Uuid::new_v4().to_string();
    let priority = input.priority.unwrap_or_default();

    conn.execute(
        r#"
        INSERT INTO tbl_task (id, title, description, url, priority, expected_duration, target_date)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        "#,
        rusqlite::params![
            id,
            input.title,
            input.description,
            input.url,
            priority.to_string(),
            input.expected_duration.unwrap_or(5),
            input.target_date,
        ],
    )
    .map_err(|e| e.to_string())?;

    // 태그 추가
    if let Some(tags) = input.tags {
        for tag in tags {
            add_tag_internal(&conn, &id, &tag)?;
        }
    }

    // 생성 액션 히스토리 기록
    add_action_history_internal(&conn, &id, "CREATED", None, Some("INBOX"), None)?;

    Ok(id)
}

/// Task 수정
#[tauri::command]
pub fn update_task(
    app_handle: AppHandle,
    state: State<DbState>,
    input: UpdateTaskInput,
) -> Result<(), String> {
    // 디버그: 입력값 확인
    println!("[update_task] Input: {:?}", input);
    println!("[update_task] remaining_time_seconds: {:?}", input.remaining_time_seconds);
    
    let conn = get_connection(&app_handle, &state)?;

    // 상태 변경 시 액션 히스토리 기록을 위해 현재 상태 조회
    let previous_status: Option<String> = if input.status.is_some() {
        conn.query_row(
            "SELECT status FROM tbl_task WHERE id = ?1",
            [&input.id],
            |row| row.get(0),
        ).ok()
    } else {
        None
    };

    // 목표일 변경 시 액션 히스토리 기록을 위해 현재 목표일 조회
    let previous_target_date: Option<String> = if input.target_date.is_some() {
        conn.query_row(
            "SELECT target_date FROM tbl_task WHERE id = ?1",
            [&input.id],
            |row| row.get(0),
        ).ok()
    } else {
        None
    };

    let mut updates = vec!["updated_at = datetime('now')".to_string()];
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];

    macro_rules! add_update {
        ($field:expr, $value:expr) => {
            if let Some(v) = $value {
                updates.push(format!("{} = ?{}", $field, params.len() + 1));
                params.push(Box::new(v));
            }
        };
    }

    add_update!("title", input.title);
    add_update!("description", input.description);
    add_update!("url", input.url);
    if let Some(p) = input.priority {
        updates.push(format!("priority = ?{}", params.len() + 1));
        params.push(Box::new(p.to_string()));
    }
    let new_status = input.status.clone();
    if let Some(s) = input.status {
        updates.push(format!("status = ?{}", params.len() + 1));
        params.push(Box::new(s.to_string()));
    }
    add_update!("total_time_spent", input.total_time_spent);
    add_update!("expected_duration", input.expected_duration);
    add_update!("remaining_time_seconds", input.remaining_time_seconds);
    // 목표일 변경 감지를 위해 클론 저장
    let new_target_date = input.target_date.clone();
    add_update!("target_date", input.target_date);
    if let Some(i) = input.is_important {
        updates.push(format!("is_important = ?{}", params.len() + 1));
        params.push(Box::new(if i { 1 } else { 0 }));
    }
    add_update!("completed_at", input.completed_at);
    add_update!("last_paused_at", input.last_paused_at);
    add_update!("last_run_at", input.last_run_at);

    let sql = format!(
        "UPDATE tbl_task SET {} WHERE id = ?{}",
        updates.join(", "),
        params.len() + 1
    );
    params.push(Box::new(input.id.clone()));

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    // 상태 변경 시 액션 히스토리 기록 (동일 상태로 변경되는 경우는 기록하지 않음)
    if let Some(new_status) = new_status {
        let new_status_str = new_status.to_string();
        // 이전 상태와 새 상태가 다를 때만 히스토리 기록
        if previous_status.as_ref().map(|s| s.as_str()) != Some(new_status_str.as_str()) {
            let action_type = match new_status_str.as_str() {
                "IN_PROGRESS" => "STARTED",
                "PAUSED" => "PAUSED",
                "COMPLETED" => "COMPLETED",
                "ARCHIVED" => "ARCHIVED",
                "INBOX" => "RESTORED",
                _ => "STATUS_CHANGED",
            };
            add_action_history_internal(
                &conn,
                &input.id,
                action_type,
                previous_status.as_deref(),
                Some(&new_status_str),
                None,
            )?;
        }
    }

    // 목표일 변경 시 액션 히스토리 기록
    if let Some(new_target_date) = &new_target_date {
        // 목표일이 실제로 변경되었는지 확인
        let changed = match &previous_target_date {
            Some(prev) => prev != new_target_date,
            None => true, // 이전에 목표일이 없었는데 새로 설정된 경우
        };
        
        if changed {
            // metadata에 이전/새 목표일 정보 저장
            let metadata = if let Some(prev) = &previous_target_date {
                format!(r#"{{"previousTargetDate":"{}","newTargetDate":"{}"}}"#, prev, new_target_date)
            } else {
                format!(r#"{{"newTargetDate":"{}"}}"#, new_target_date)
            };
            
            add_action_history_internal(
                &conn,
                &input.id,
                "TARGET_DATE_CHANGED",
                None,
                None,
                Some(&metadata),
            )?;
        }
    }

    Ok(())
}

/// Task 삭제
#[tauri::command]
pub fn delete_task(
    app_handle: AppHandle,
    state: State<DbState>,
    id: String,
) -> Result<(), String> {
    let conn = get_connection(&app_handle, &state)?;
    conn.execute("DELETE FROM tbl_task WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ============================================================================
// 메모/노트/태그 커맨드
// ============================================================================

/// 메모 추가
#[tauri::command]
pub fn add_task_memo(
    app_handle: AppHandle,
    state: State<DbState>,
    task_id: String,
    content: String,
) -> Result<TaskMemo, String> {
    let conn = get_connection(&app_handle, &state)?;
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO tbl_task_memo (id, task_id, content) VALUES (?1, ?2, ?3)",
        rusqlite::params![id, task_id, content],
    )
    .map_err(|e| e.to_string())?;

    let memo = conn
        .query_row(
            "SELECT id, task_id, content, created_at FROM tbl_task_memo WHERE id = ?1",
            [&id],
            |row| {
                Ok(TaskMemo {
                    id: row.get(0)?,
                    task_id: row.get(1)?,
                    content: row.get(2)?,
                    created_at: row.get(3)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(memo)
}

/// 노트 추가
#[tauri::command]
pub fn add_task_note(
    app_handle: AppHandle,
    state: State<DbState>,
    task_id: String,
    title: String,
    content: String,
) -> Result<TaskNote, String> {
    let conn = get_connection(&app_handle, &state)?;
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO tbl_task_note (id, task_id, title, content) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![id, task_id, title, content],
    )
    .map_err(|e| e.to_string())?;

    let note = conn
        .query_row(
            "SELECT id, task_id, title, content, created_at, updated_at FROM tbl_task_note WHERE id = ?1",
            [&id],
            |row| {
                Ok(TaskNote {
                    id: row.get(0)?,
                    task_id: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(note)
}

/// 노트 업데이트
#[tauri::command]
pub fn update_task_note(
    app_handle: AppHandle,
    state: State<DbState>,
    note_id: String,
    title: Option<String>,
    content: Option<String>,
) -> Result<TaskNote, String> {
    let conn = get_connection(&app_handle, &state)?;

    let mut updates = vec!["updated_at = datetime('now')".to_string()];
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];

    if let Some(t) = title {
        updates.push(format!("title = ?{}", params.len() + 1));
        params.push(Box::new(t));
    }
    if let Some(c) = content {
        updates.push(format!("content = ?{}", params.len() + 1));
        params.push(Box::new(c));
    }

    let sql = format!(
        "UPDATE tbl_task_note SET {} WHERE id = ?{}",
        updates.join(", "),
        params.len() + 1
    );
    params.push(Box::new(note_id.clone()));

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    let note = conn
        .query_row(
            "SELECT id, task_id, title, content, created_at, updated_at FROM tbl_task_note WHERE id = ?1",
            [&note_id],
            |row| {
                Ok(TaskNote {
                    id: row.get(0)?,
                    task_id: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(note)
}

/// 태그 추가
#[tauri::command]
pub fn add_task_tag(
    app_handle: AppHandle,
    state: State<DbState>,
    task_id: String,
    tag: String,
) -> Result<(), String> {
    let conn = get_connection(&app_handle, &state)?;
    add_tag_internal(&conn, &task_id, &tag)
}

fn add_tag_internal(conn: &Connection, task_id: &str, tag: &str) -> Result<(), String> {
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT OR IGNORE INTO tbl_task_tag (id, task_id, tag) VALUES (?1, ?2, ?3)",
        rusqlite::params![id, task_id, tag],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// 태그 제거
#[tauri::command]
pub fn remove_task_tag(
    app_handle: AppHandle,
    state: State<DbState>,
    task_id: String,
    tag: String,
) -> Result<(), String> {
    let conn = get_connection(&app_handle, &state)?;
    conn.execute(
        "DELETE FROM tbl_task_tag WHERE task_id = ?1 AND tag = ?2",
        rusqlite::params![task_id, tag],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ============================================================================
// 히스토리 커맨드
// ============================================================================

/// 실행 시작
#[tauri::command]
pub fn start_task_run(
    app_handle: AppHandle,
    state: State<DbState>,
    task_id: String,
) -> Result<String, String> {
    let conn = get_connection(&app_handle, &state)?;
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        r#"
        INSERT INTO tbl_task_run_history (id, task_id, started_at, duration, end_type)
        VALUES (?1, ?2, datetime('now'), 0, 'running')
        "#,
        rusqlite::params![id, task_id],
    )
    .map_err(|e| e.to_string())?;

    // Task의 last_run_at 업데이트
    conn.execute(
        "UPDATE tbl_task SET last_run_at = datetime('now'), updated_at = datetime('now') WHERE id = ?1",
        [&task_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

/// 실행 종료
#[tauri::command]
pub fn end_task_run(
    app_handle: AppHandle,
    state: State<DbState>,
    run_id: String,
    end_type: String,
    duration: i64,
) -> Result<(), String> {
    let conn = get_connection(&app_handle, &state)?;

    conn.execute(
        r#"
        UPDATE tbl_task_run_history 
        SET ended_at = datetime('now'), duration = ?2, end_type = ?3
        WHERE id = ?1
        "#,
        rusqlite::params![run_id, duration, end_type],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// 시간 추가
#[tauri::command]
pub fn extend_task_time(
    app_handle: AppHandle,
    state: State<DbState>,
    input: ExtendTimeInput,
) -> Result<(), String> {
    let conn = get_connection(&app_handle, &state)?;
    let id = uuid::Uuid::new_v4().to_string();

    // 히스토리 추가
    conn.execute(
        r#"
        INSERT INTO tbl_task_time_extension (id, task_id, added_minutes, previous_duration, new_duration, reason)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#,
        rusqlite::params![
            id,
            input.task_id,
            input.added_minutes,
            input.previous_duration,
            input.new_duration,
            input.reason,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Task의 expected_duration 업데이트
    conn.execute(
        "UPDATE tbl_task SET expected_duration = ?2, updated_at = datetime('now') WHERE id = ?1",
        rusqlite::params![input.task_id, input.new_duration],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// 사이드바 카운트 커맨드
// ============================================================================

#[derive(serde::Serialize)]
pub struct SidebarCounts {
    pub inbox: i64,
    pub completed: i64,
    pub starred: i64,
    pub today: i64,
    pub tomorrow: i64,
    pub overdue: i64,
    pub archive: i64,
}

/// 사이드바 메뉴별 태스크 카운트 조회
#[tauri::command]
pub fn get_sidebar_counts(
    app_handle: AppHandle,
    state: State<DbState>,
) -> Result<SidebarCounts, String> {
    let conn = get_connection(&app_handle, &state)?;

    // 각 메뉴별 카운트 쿼리
    // inbox: 미완료 작업 전체 (INBOX, IN_PROGRESS, PAUSED) - 화면에 표시되는 전체 수
    let inbox: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tbl_task WHERE status IN ('INBOX', 'IN_PROGRESS', 'PAUSED')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let completed: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tbl_task WHERE status = 'COMPLETED'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let starred: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tbl_task WHERE is_important = 1 AND status NOT IN ('COMPLETED', 'ARCHIVED')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // target_date는 ISO 8601 UTC 형식으로 저장되므로 localtime으로 변환하여 비교
    let today: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tbl_task WHERE date(target_date, 'localtime') = date('now', 'localtime') AND status NOT IN ('COMPLETED', 'ARCHIVED')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let tomorrow: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tbl_task WHERE date(target_date, 'localtime') = date('now', 'localtime', '+1 day') AND status NOT IN ('COMPLETED', 'ARCHIVED')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let overdue: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tbl_task WHERE date(target_date, 'localtime') < date('now', 'localtime') AND status NOT IN ('COMPLETED', 'ARCHIVED')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let archive: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tbl_task WHERE status = 'ARCHIVED'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(SidebarCounts {
        inbox,
        completed,
        starred,
        today,
        tomorrow,
        overdue,
        archive,
    })
}

// ============================================================================
// 설정 커맨드
// ============================================================================

/// 설정 조회
#[tauri::command]
pub fn get_setting(
    app_handle: AppHandle,
    state: State<DbState>,
    key: String,
) -> Result<Option<String>, String> {
    let conn = get_connection(&app_handle, &state)?;

    let result = conn.query_row(
        "SELECT value FROM tbl_setting WHERE key = ?1",
        [&key],
        |row| row.get::<_, Option<String>>(0),
    );

    match result {
        Ok(value) => Ok(value),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// 설정 저장
#[tauri::command]
pub fn set_setting(
    app_handle: AppHandle,
    state: State<DbState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let conn = get_connection(&app_handle, &state)?;

    conn.execute(
        r#"
        INSERT INTO tbl_setting (id, key, value, updated_at)
        VALUES ('setting_' || ?1, ?1, ?2, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')
        "#,
        rusqlite::params![key, value],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// 전체 설정 조회
#[tauri::command]
pub fn get_all_settings(
    app_handle: AppHandle,
    state: State<DbState>,
) -> Result<Vec<Setting>, String> {
    let conn = get_connection(&app_handle, &state)?;

    let mut stmt = conn
        .prepare("SELECT id, key, value, updated_at FROM tbl_setting ORDER BY key")
        .map_err(|e| e.to_string())?;

    let settings = stmt
        .query_map([], |row| {
            Ok(Setting {
                id: row.get(0)?,
                key: row.get(1)?,
                value: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(settings)
}

// ============================================================================
// 테이블 조회 커맨드 (고급)
// ============================================================================

/// 테이블 목록 조회
#[tauri::command]
pub fn list_tables(
    app_handle: AppHandle,
    state: State<DbState>,
) -> Result<Vec<String>, String> {
    let conn = get_connection(&app_handle, &state)?;
    get_table_list(&conn)
}

/// 테이블 내용 조회
#[tauri::command]
pub fn query_table(
    app_handle: AppHandle,
    state: State<DbState>,
    table_name: String,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<TableRow>, String> {
    let conn = get_connection(&app_handle, &state)?;

    // 테이블명 검증 (SQL 인젝션 방지)
    if !table_name.starts_with("tbl_") || table_name.contains(|c: char| !c.is_alphanumeric() && c != '_') {
        return Err("유효하지 않은 테이블명입니다.".to_string());
    }

    let sql = format!(
        "SELECT * FROM {} LIMIT {} OFFSET {}",
        table_name,
        limit.unwrap_or(100),
        offset.unwrap_or(0)
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let columns: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();

    let rows: Vec<TableRow> = stmt
        .query_map([], |row| {
            let mut values = Vec::new();
            for i in 0..columns.len() {
                let val = match row.get_ref(i) {
                    Ok(rusqlite::types::ValueRef::Null) => serde_json::Value::Null,
                    Ok(rusqlite::types::ValueRef::Integer(i)) => json!(i),
                    Ok(rusqlite::types::ValueRef::Real(f)) => json!(f),
                    Ok(rusqlite::types::ValueRef::Text(t)) => {
                        json!(String::from_utf8_lossy(t).to_string())
                    }
                    Ok(rusqlite::types::ValueRef::Blob(b)) => json!(format!("[blob {} bytes]", b.len())),
                    Err(_) => serde_json::Value::Null,
                };
                values.push(val);
            }
            Ok(TableRow {
                columns: columns.clone(),
                values,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

// ============================================================================
// 내부 헬퍼 함수들
// ============================================================================

fn map_task_row(row: &rusqlite::Row) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get("id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        url: row.get("url")?,
        slack_message_id: row.get("slack_message_id")?,
        priority: TaskPriority::from(row.get::<_, String>("priority")?.as_str()),
        status: TaskStatus::from(row.get::<_, String>("status")?.as_str()),
        total_time_spent: row.get("total_time_spent")?,
        expected_duration: row.get("expected_duration")?,
        remaining_time_seconds: row.get("remaining_time_seconds")?,
        target_date: row.get("target_date")?,
        is_important: row.get::<_, i64>("is_important")? != 0,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        completed_at: row.get("completed_at")?,
        last_paused_at: row.get("last_paused_at")?,
        last_run_at: row.get("last_run_at")?,
        tags: vec![],
        memos: vec![],
        notes: vec![],
        run_history: vec![],
        time_extensions: vec![],
        action_history: vec![],
    })
}

fn load_task_tags(conn: &Connection, task_id: &str) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare("SELECT tag FROM tbl_task_tag WHERE task_id = ?1 ORDER BY created_at")
        .map_err(|e| e.to_string())?;

    let tags = stmt
        .query_map([task_id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tags)
}

fn load_task_memos(conn: &Connection, task_id: &str) -> Result<Vec<TaskMemo>, String> {
    let mut stmt = conn
        .prepare("SELECT id, task_id, content, created_at FROM tbl_task_memo WHERE task_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let memos = stmt
        .query_map([task_id], |row| {
            Ok(TaskMemo {
                id: row.get(0)?,
                task_id: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(memos)
}

fn load_task_notes(conn: &Connection, task_id: &str) -> Result<Vec<TaskNote>, String> {
    let mut stmt = conn
        .prepare("SELECT id, task_id, title, content, created_at, updated_at FROM tbl_task_note WHERE task_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let notes = stmt
        .query_map([task_id], |row| {
            Ok(TaskNote {
                id: row.get(0)?,
                task_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(notes)
}

fn load_task_run_history(conn: &Connection, task_id: &str) -> Result<Vec<TaskRunHistory>, String> {
    let mut stmt = conn
        .prepare("SELECT id, task_id, started_at, ended_at, duration, end_type FROM tbl_task_run_history WHERE task_id = ?1 ORDER BY started_at DESC")
        .map_err(|e| e.to_string())?;

    let history = stmt
        .query_map([task_id], |row| {
            Ok(TaskRunHistory {
                id: row.get(0)?,
                task_id: row.get(1)?,
                started_at: row.get(2)?,
                ended_at: row.get(3)?,
                duration: row.get(4)?,
                end_type: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(history)
}

fn load_task_time_extensions(conn: &Connection, task_id: &str) -> Result<Vec<TaskTimeExtension>, String> {
    let mut stmt = conn
        .prepare("SELECT id, task_id, added_minutes, previous_duration, new_duration, reason, created_at FROM tbl_task_time_extension WHERE task_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let extensions = stmt
        .query_map([task_id], |row| {
            Ok(TaskTimeExtension {
                id: row.get(0)?,
                task_id: row.get(1)?,
                added_minutes: row.get(2)?,
                previous_duration: row.get(3)?,
                new_duration: row.get(4)?,
                reason: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(extensions)
}

fn load_task_action_history(conn: &Connection, task_id: &str) -> Result<Vec<TaskActionHistory>, String> {
    let mut stmt = conn
        .prepare("SELECT id, task_id, action_type, previous_status, new_status, metadata, created_at FROM tbl_task_action_history WHERE task_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let history = stmt
        .query_map([task_id], |row| {
            Ok(TaskActionHistory {
                id: row.get(0)?,
                task_id: row.get(1)?,
                action_type: row.get(2)?,
                previous_status: row.get(3)?,
                new_status: row.get(4)?,
                metadata: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(history)
}

/// 액션 히스토리 기록 내부 함수
fn add_action_history_internal(
    conn: &Connection,
    task_id: &str,
    action_type: &str,
    previous_status: Option<&str>,
    new_status: Option<&str>,
    metadata: Option<&str>,
) -> Result<(), String> {
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        r#"
        INSERT INTO tbl_task_action_history (id, task_id, action_type, previous_status, new_status, metadata)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#,
        rusqlite::params![id, task_id, action_type, previous_status, new_status, metadata],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

