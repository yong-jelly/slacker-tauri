# 미루미 App UI/UX 정책

## 1. 네비게이션 정책

### 1.1 사이드바 메뉴 구조

| 메뉴 ID | 레이블 | 필터 조건 | 카운트 조건 |
|---------|--------|-----------|-------------|
| `inbox` | 할일 | 전체 미완료 작업 표시 | `INBOX + IN_PROGRESS + PAUSED` 상태 태스크 수 |
| `completed` | 완료 | `status = COMPLETED` | COMPLETED 상태 태스크 수 |
| `starred` | 중요 | `is_important = true AND status NOT IN (COMPLETED, ARCHIVED)` | 중요 미완료 태스크 수 |
| `today` | 오늘 | `target_date = 오늘 AND status NOT IN (COMPLETED, ARCHIVED)` | 오늘 예정 미완료 태스크 수 |
| `tomorrow` | 내일 | `target_date = 내일 AND status NOT IN (COMPLETED, ARCHIVED)` | 내일 예정 미완료 태스크 수 |
| `overdue` | 지연됨 | `target_date < 오늘 AND status NOT IN (COMPLETED, ARCHIVED)` | 지연된 미완료 태스크 수 |
| `archive` | 보관함 | `status = ARCHIVED` | ARCHIVED 상태 태스크 수 |
| `settings` | 설정 | - | - |

### 1.2 메뉴 이동 시 동작

1. **진행중(IN_PROGRESS) 태스크 자동 일시정지**
   - 메뉴 이동 시 진행중인 모든 태스크를 `PAUSED` 상태로 변경
   - 사용자에게 별도 확인 없이 자동 처리
   - `last_paused_at` 타임스탬프 기록

2. **태스크 추가 UI 자동 취소**
   - 태스크 추가 폼이 열린 상태에서 메뉴 이동 시 자동 닫힘
   - 입력 중인 데이터는 저장되지 않음

### 1.3 태스크 목록 메뉴 vs 설정 메뉴

- **태스크 목록 메뉴**: `inbox`, `completed`, `starred`, `today`, `tomorrow`, `overdue`, `archive`
- **설정 메뉴**: `settings`

## 2. 헤더 UI 정책

### 2.1 헤더 버튼 노출 조건

| 버튼 | 노출 조건 |
|------|-----------|
| Widget 모드 버튼 | 진행중(IN_PROGRESS) 태스크가 있을 때 |
| 추가하기 버튼 | 태스크 목록 메뉴일 때 (설정 메뉴에서는 숨김) |

### 2.2 태스크 추가 버튼

- 태스크 목록 메뉴에서만 표시
- 설정 페이지에서는 숨김
- 클릭 시 할일(inbox) 섹션에 추가 폼 표시

## 3. 태스크 상태 관리 정책

### 3.1 상태 전이 규칙

```
INBOX ─────► IN_PROGRESS ◄─────► PAUSED
  │              │                  │
  │              ▼                  │
  │          COMPLETED              │
  │              │                  │
  └──────────► ARCHIVED ◄───────────┘
```

### 3.2 자동 상태 변경

| 트리거 | 현재 상태 | 변경 상태 | 조건 |
|--------|-----------|-----------|------|
| 메뉴 이동 | IN_PROGRESS | PAUSED | 항상 |
| 타이머 완료 | IN_PROGRESS | COMPLETED | 타이머 종료 시 |
| Play 버튼 | INBOX, PAUSED | IN_PROGRESS | 사용자 액션 |

## 4. 설정 페이지 정책

### 4.1 레이아웃

- 설정 카드: 가운데 정렬, 고정 너비 (max-width: 480px)
- 뒤로가기 버튼 없음 (사이드바로 이동)
- 페이지 타이틀: "설정" (왼쪽 정렬)

### 4.2 설정 항목

| 카테고리 | 설정 항목 | 타입 | 기본값 |
|----------|-----------|------|--------|
| 데이터베이스 | DB 파일 경로 | 표시 전용 | - |
| | DB 파일 변경 | 버튼 | - |
| | 연결 해제 | 버튼 | - |
| 앱 설정 | 테마 | Select | system |
| | 언어 | Select | ko |
| | 기본 타이머 시간 | Number | 25 |
| | 알림 소리 | Toggle | true |
| | 알림 진동 | Toggle | true |
| 고급 설정 | 테이블 조회 | Accordion | - |

## 5. 컴포넌트 스타일 정책

### 5.1 색상 팔레트

```css
--color-bg-primary: #1E1F22;     /* 메인 배경 */
--color-bg-secondary: #2B2D31;   /* 카드/사이드바 배경 */
--color-bg-input: #1E1F22;       /* 인풋 배경 */
--color-border: rgba(255, 255, 255, 0.05);
--color-border-input: rgba(255, 255, 255, 0.1);
--color-text-primary: #FFFFFF;
--color-text-secondary: #9CA3AF; /* gray-400 */
--color-text-muted: #6B7280;     /* gray-500 */
--color-accent: #22C55E;         /* green-500 */
--color-accent-hover: #16A34A;   /* green-600 */
```

### 5.2 공통 컴포넌트 스타일

#### Select
```css
background: var(--color-bg-input);
border: 1px solid var(--color-border-input);
border-radius: 8px;
padding: 8px 12px;
font-size: 14px;
color: var(--color-text-primary);
```

#### Number Input
```css
background: var(--color-bg-input);
border: 1px solid var(--color-border-input);
border-radius: 8px;
padding: 8px 12px;
text-align: center;
width: 80px;
```

#### Toggle Switch
```css
width: 44px;
height: 24px;
border-radius: 12px;
background: var(--color-text-muted); /* off 상태 */
background: var(--color-accent);     /* on 상태 */
```

## 6. 데이터 동기화 정책

### 6.1 카운트 리프레시

- 태스크 CRUD 작업 후 사이드바 카운트 자동 갱신
- `useSidebarCounts` 훅의 `refresh()` 호출

### 6.2 태스크 목록 리프레시

- 메뉴 변경 시 해당 필터 조건으로 태스크 목록 재필터링
- 로컬 필터링 (DB 재조회 없음, 메모리 내 필터)

