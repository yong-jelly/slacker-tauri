# Tauri 앱 디버깅 가이드

## 창이 보이지 않을 때 디버깅 방법

### 1. 브라우저 개발자 도구 열기
Tauri 앱에서 개발자 도구를 열려면:

**방법 1: 코드로 열기**
```typescript
import { getCurrentWindow } from "@tauri-apps/api/window";

// 개발 모드에서만 개발자 도구 열기
if (import.meta.env.DEV) {
  const window = getCurrentWindow();
  window.openDevTools();
}
```

**방법 2: 단축키 사용**
- macOS: `Cmd + Option + I`
- Windows/Linux: `Ctrl + Shift + I`

**방법 3: 트레이 메뉴에 추가**
트레이 아이콘 우클릭 메뉴에 "개발자 도구 열기" 옵션 추가

### 2. Rust 백엔드 로그 확인
터미널에서 앱을 실행하면 Rust 백엔드 로그가 출력됩니다:

```bash
# 개발 모드 실행
bun run tauri dev

# 또는
cd src-tauri && cargo run
```

로그에서 확인할 사항:
- 창 생성 성공/실패 메시지
- 에러 메시지
- `show_main_window` 함수 호출 여부

### 3. 프론트엔드 콘솔 로그 확인
브라우저 개발자 도구의 Console 탭에서:
- React 컴포넌트 렌더링 로그
- 에러 메시지
- 상태 변경 로그

### 4. 창 상태 확인
```typescript
import { getCurrentWindow } from "@tauri-apps/api/window";

const window = getCurrentWindow();

// 창 상태 확인
const isVisible = await window.isVisible();
const isMinimized = await window.isMinimized();
const position = await window.outerPosition();
const size = await window.outerSize();

console.log({
  isVisible,
  isMinimized,
  position,
  size
});
```

### 5. 현재 문제 가능성

#### 문제 1: TaskSettingsPage가 전체 화면을 덮음
`TaskSettingsPage`가 `fixed inset-0 z-50`로 설정되어 있어 AppLayout 위에 렌더링됩니다.
이 경우 창은 보이지만 내용이 가려질 수 있습니다.

**해결 방법:**
- TaskSettingsPage를 AppLayout 내부에 렌더링하거나
- 포털을 사용하여 body에 직접 렌더링

#### 문제 2: 창이 최소화된 상태
`main.rs`에서 창 닫기 시 `minimize()`를 사용하므로, 창이 최소화된 상태일 수 있습니다.

**확인 방법:**
```rust
// main.rs의 show_main_window 함수에 로그 추가
fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        println!("Showing main window");
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    } else {
        println!("Main window not found!");
    }
}
```

#### 문제 3: 창이 화면 밖에 위치
창이 화면 밖에 위치해 보이지 않을 수 있습니다.

**해결 방법:**
```rust
// 창 위치를 화면 중앙으로 이동
fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.center(); // 화면 중앙으로 이동
        let _ = window.set_focus();
    }
}
```

### 6. 즉시 확인할 수 있는 디버깅 코드

`MainPage.tsx`에 추가:
```typescript
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";

useEffect(() => {
  const checkWindow = async () => {
    const window = getCurrentWindow();
    const isVisible = await window.isVisible();
    const isMinimized = await window.isMinimized();
    console.log("Window state:", { isVisible, isMinimized });
    
    if (!isVisible || isMinimized) {
      await window.show();
      await window.unminimize();
      await window.setFocus();
    }
  };
  
  checkWindow();
}, []);
```

### 7. TaskSettingsPage 렌더링 문제 해결

현재 TaskSettingsPage가 `fixed inset-0`로 설정되어 있어 문제가 될 수 있습니다.
AppLayout과 함께 사용하려면 포털을 사용하거나, AppLayout 내부에 렌더링해야 합니다.

