use rusqlite::Connection;

use super::schema::SCHEMA_SQL;

/// 데이터베이스 마이그레이션 실행
pub fn run_migrations(conn: &Connection) -> Result<(), String> {
    // Foreign Key 활성화
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;

    // 스키마 생성 (멱등성 보장 - IF NOT EXISTS)
    conn.execute_batch(SCHEMA_SQL)
        .map_err(|e| format!("Failed to create schema: {}", e))?;

    // 기본 설정값 시드
    seed_default_settings(conn)?;

    Ok(())
}

/// 기본 설정값 삽입
fn seed_default_settings(conn: &Connection) -> Result<(), String> {
    let defaults = vec![
        ("schema_version", "1"),
        ("theme", "\"system\""),
        ("language", "\"ko\""),
        ("timer_default_minutes", "5"),
        ("notification_sound", "true"),
        ("notification_vibration", "true"),
    ];

    for (key, value) in defaults {
        conn.execute(
            r#"
            INSERT OR IGNORE INTO tbl_setting (id, key, value, updated_at)
            VALUES (
                'setting_' || ?1,
                ?1,
                ?2,
                datetime('now')
            )
            "#,
            rusqlite::params![key, value],
        )
        .map_err(|e| format!("Failed to seed setting '{}': {}", key, e))?;
    }

    Ok(())
}

/// 테이블 목록 조회
pub fn get_table_list(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'tbl_%' ORDER BY name")
        .map_err(|e| e.to_string())?;

    let tables = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tables)
}

