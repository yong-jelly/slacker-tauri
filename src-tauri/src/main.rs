// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, WindowEvent,
};
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};

use db::{DbState, 
    get_db_status, init_db, load_existing_db, logout,
    list_tasks, get_task, create_task, update_task, delete_task,
    add_task_memo, add_task_note, update_task_note, add_task_tag, remove_task_tag,
    start_task_run, end_task_run, extend_task_time,
    get_setting, set_setting, get_all_settings,
    get_sidebar_counts,
    list_tables, query_table,
};

// 타이머 상태 관리
struct TimerState {
    remaining_secs: u64,
    task_title: String,
    is_running: bool,
}

impl Default for TimerState {
    fn default() -> Self {
        Self {
            remaining_secs: 0,
            task_title: String::new(),
            is_running: false,
        }
    }
}

type SharedTimerState = Arc<Mutex<TimerState>>;

fn main() {
    let timer_state: SharedTimerState = Arc::new(Mutex::new(TimerState::default()));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(timer_state)
        .manage(DbState::default())
        .setup(|app| {
            // 시스템 트레이 설정
            let show_item = MenuItem::with_id(app, "show", "앱 열기", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(false)  // 왼쪽 클릭은 메뉴 안 보여줌
                .title("미루미")
                .tooltip("미루미 - Task Timer")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        show_main_window(app);
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                // 왼쪽 클릭 시 앱 창 표시 (Slack 스타일)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // 백그라운드 타이머 루프 (1초마다)
            let app_handle = app.handle().clone();
            let timer_state = app.state::<SharedTimerState>().inner().clone();
            
            tauri::async_runtime::spawn(async move {
                let mut ticker = interval(Duration::from_secs(1));
                
                loop {
                    ticker.tick().await;
                    
                    let mut state = timer_state.lock().await;
                    if state.is_running && state.remaining_secs > 0 {
                        // 1초 감소
                        state.remaining_secs -= 1;
                        
                        // 트레이 업데이트
                        let title = format_tray_title(&state.task_title, state.remaining_secs);
                        update_tray(&app_handle, &title);
                        
                        // 타이머 종료 시
                        if state.remaining_secs == 0 {
                            state.is_running = false;
                            update_tray(&app_handle, "미루미");
                            let _ = app_handle.emit("timer-ended", ());
                        }
                    }
                }
            });

            Ok(())
        })
        // 창 닫기 버튼 클릭 시 앱 종료 대신 최소화 (macOS 호환성)
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // hide() 대신 minimize() 사용 - macOS에서 더 잘 작동
                let _ = window.minimize();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            // 타이머 커맨드
            start_tray_timer,
            stop_tray_timer,
            get_remaining_time,
            sync_tray_timer,
            update_tray_timer,
            // DB 관리 커맨드
            get_db_status,
            init_db,
            load_existing_db,
            logout,
            // Task CRUD 커맨드
            list_tasks,
            get_task,
            create_task,
            update_task,
            delete_task,
            // 메모/노트/태그 커맨드
            add_task_memo,
            add_task_note,
            update_task_note,
            add_task_tag,
            remove_task_tag,
            // 히스토리 커맨드
            start_task_run,
            end_task_run,
            extend_task_time,
            // 설정 커맨드
            get_setting,
            set_setting,
            get_all_settings,
            // 사이드바 카운트 커맨드
            get_sidebar_counts,
            // 테이블 조회 커맨드
            list_tables,
            query_table,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 메인 창 표시 (트레이에서 호출)
fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        // 숨겨진 창 표시
        let _ = window.show();
        // 최소화된 경우 복원
        let _ = window.unminimize();
        // 포커스 설정
        let _ = window.set_focus();
    }
}

// 트레이 타이틀 포맷
fn format_tray_title(task_title: &str, seconds: u64) -> String {
    let mins = seconds / 60;
    let secs = seconds % 60;
    let time = format!("{:02}:{:02}", mins, secs);
    
    if !task_title.is_empty() {
        let max_len = 12;
        let truncated = if task_title.chars().count() > max_len {
            format!("{}…", task_title.chars().take(max_len).collect::<String>())
        } else {
            task_title.to_string()
        };
        format!("{} {}", truncated, time)
    } else {
        format!("⏱ {}", time)
    }
}

// 트레이 업데이트 헬퍼
fn update_tray(app: &AppHandle, title: &str) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_title(Some(title));
    }
}

// 트레이 타이머 시작 (Play 시 호출)
#[tauri::command]
async fn start_tray_timer(
    state: tauri::State<'_, SharedTimerState>,
    app: AppHandle,
    remaining_secs: u64,
    task_title: String,
) -> Result<(), String> {
    let mut timer = state.lock().await;
    timer.remaining_secs = remaining_secs;
    timer.task_title = task_title.clone();
    timer.is_running = true;
    
    // 즉시 트레이 업데이트
    let title = format_tray_title(&task_title, remaining_secs);
    update_tray(&app, &title);
    
    Ok(())
}

// 트레이 타이머 정지 (Pause/Stop 시 호출)
// 실행 중인 task가 없을 때만 "미루미"로 변경하도록 프론트엔드에서 처리
#[tauri::command]
async fn stop_tray_timer(
    state: tauri::State<'_, SharedTimerState>,
    app: AppHandle,
    update_to_slacker: Option<bool>,
) -> Result<u64, String> {
    let mut timer = state.lock().await;
    timer.is_running = false;
    let remaining = timer.remaining_secs;
    
    // update_to_slacker가 true일 때만 "미루미"로 변경 (기본값은 false)
    if update_to_slacker.unwrap_or(false) {
        update_tray(&app, "미루미");
    } else {
        // 일시정지 시 현재 태스크 제목과 남은 시간을 트레이에 고정하여 표시 (흐르지 않게 함)
        let title = format_tray_title(&timer.task_title, timer.remaining_secs);
        update_tray(&app, &title);
    }
    
    Ok(remaining)
}

// 트레이 타이머 업데이트 (다른 실행 중인 task로 전환 시)
#[tauri::command]
async fn update_tray_timer(
    state: tauri::State<'_, SharedTimerState>,
    app: AppHandle,
    remaining_secs: u64,
    task_title: String,
) -> Result<(), String> {
    let mut timer = state.lock().await;
    timer.remaining_secs = remaining_secs;
    timer.task_title = task_title.clone();
    timer.is_running = true;
    
    // 즉시 트레이 업데이트
    let title = format_tray_title(&task_title, remaining_secs);
    update_tray(&app, &title);
    
    Ok(())
}

// 현재 남은 시간 조회 (포그라운드 복귀 시 호출)
#[tauri::command]
async fn get_remaining_time(
    state: tauri::State<'_, SharedTimerState>,
) -> Result<(u64, bool), String> {
    let timer = state.lock().await;
    Ok((timer.remaining_secs, timer.is_running))
}

// 트레이 타이머 시간 동기화 (앱에서 시간 변경 시)
#[tauri::command]
async fn sync_tray_timer(
    state: tauri::State<'_, SharedTimerState>,
    app: AppHandle,
    remaining_secs: u64,
) -> Result<(), String> {
    let mut timer = state.lock().await;
    timer.remaining_secs = remaining_secs;
    
    if timer.is_running {
        let title = format_tray_title(&timer.task_title, remaining_secs);
        update_tray(&app, &title);
    }
    
    Ok(())
}
