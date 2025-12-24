# macOS 빌드 및 배포 가이드

## 📌 버전 관리

프로젝트의 버전은 **`src-tauri/Cargo.toml`**에서 단일 소스로 관리됩니다.

```toml
[package]
version = "0.1.0"  # 여기서 버전 변경
```

버전을 변경하면:
- `tauri.conf.json`은 자동으로 Cargo.toml의 버전을 사용합니다
- 프론트엔드 UI는 Tauri API를 통해 버전을 표시합니다
- `build.sh` 스크립트는 자동으로 Cargo.toml에서 버전을 파싱합니다

### 버전 변경 방법

1. `src-tauri/Cargo.toml`의 `version` 필드 수정
2. 빌드하면 자동으로 새 버전이 적용됩니다

```bash
# 예: 0.1.0 → 0.2.0
# Cargo.toml 수정 후
bun run tauri build
```

## 🔨 빌드하기

```bash
bun run tauri build
```

빌드가 완료되면 `src-tauri/target/release/bundle/` 디렉토리에 배포 파일이 생성됩니다:

```
src-tauri/target/release/bundle/
├── macos/
│   └── mirumi.app        # 앱 번들 (직접 실행 가능)
└── dmg/
    └── mirumi_0.1.0_aarch64.dmg   # DMG 설치 파일
```

## 📦 배포 파일 종류

| 파일 | 용도 |
|------|------|
| `mirumi.app` | 앱 번들. 압축해서 공유하거나 `/Applications`에 복사해서 사용 |
| `mirumi_x.x.x_aarch64.dmg` | DMG 이미지. 다운로드 후 드래그 앤 드롭으로 설치 |

## 🔐 코드 서명 (Code Signing)

### 현재 설정 (Ad-hoc 서명)
`tauri.conf.json`에서 `signingIdentity: "-"`로 설정되어 있어 **Ad-hoc 서명**이 적용됩니다.
- Apple Developer 계정 없이 빌드 가능
- 다른 사람에게 배포할 때 **Gatekeeper 경고**가 표시됨

### Apple Developer 서명 (선택사항)
정식 배포를 원하면 Apple Developer 계정($99/년)이 필요합니다:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

## 👥 다른 사람에게 배포하기

### 방법 1: DMG 파일 공유 (권장)
1. `src-tauri/target/release/bundle/dmg/mirumi_x.x.x_aarch64.dmg` 파일을 공유
2. Google Drive, Dropbox, GitHub Releases 등에 업로드
3. 받는 사람이 DMG를 열고 앱을 `/Applications`로 드래그

### 방법 2: .app 번들 압축
1. `mirumi.app`을 우클릭 → "압축"
2. `mirumi.app.zip` 파일을 공유

### 방법 3: GitHub Releases
```bash
# 태그 생성 후 릴리스
git tag v0.1.0
git push origin v0.1.0
```
GitHub에서 릴리스 생성 후 DMG 파일 첨부

## ⚠️ 받는 사람의 설치 방법

Ad-hoc 서명된 앱은 **Gatekeeper 경고**가 나타납니다.

### 설치 시 "손상되었거나 알 수 없는 개발자" 경고 해결

#### 방법 1: 우클릭으로 열기
1. 앱을 `/Applications`로 이동
2. 앱을 **우클릭** (또는 Control+클릭) → **열기** 선택
3. 경고창에서 **열기** 버튼 클릭

#### 방법 2: 시스템 환경설정
1. **시스템 설정** → **개인 정보 보호 및 보안**
2. 하단의 "mirumi" 앱에 대해 **확인 없이 열기** 클릭

#### 방법 3: 터미널 명령어 (xattr 제거)
```bash
# 앱의 격리 속성 제거
xattr -cr /Applications/mirumi.app
```

## 🍎 공증 (Notarization) - 선택사항

Apple Developer 계정이 있다면 앱을 **공증**하면 Gatekeeper 경고 없이 배포 가능:

```bash
# 환경변수 설정
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAM_ID"

# 빌드 시 자동 공증
bun run tauri build
```

`tauri.conf.json`에 공증 설정 추가:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
      "providerShortName": "TEAM_ID"
    }
  }
}
```

## 🏗️ 아키텍처별 빌드

### Apple Silicon (M1/M2/M3) - 기본
```bash
bun run tauri build
# → mirumi_x.x.x_aarch64.dmg
```

### Intel Mac용 빌드
```bash
bun run tauri build --target x86_64-apple-darwin
# → mirumi_x.x.x_x64.dmg
```

### Universal Binary (양쪽 지원)
```bash
bun run tauri build --target universal-apple-darwin
# → mirumi_x.x.x_universal.dmg
```

## 📋 배포 체크리스트

- [ ] `bun run tauri build` 실행
- [ ] `src-tauri/target/release/bundle/dmg/` 에서 DMG 파일 확인
- [ ] 본인 Mac에서 DMG 설치 테스트
- [ ] 파일 공유 (GitHub Releases, 클라우드 등)
- [ ] 받는 사람에게 **우클릭 → 열기** 안내

## 🔧 문제 해결

### "앱이 손상되었습니다" 오류
```bash
xattr -cr /Applications/mirumi.app
```

### DMG가 생성되지 않음
```bash
# Xcode Command Line Tools 확인
xcode-select --install

# create-dmg 설치 확인
brew install create-dmg
```

### 빌드 실패 시
```bash
# 캐시 정리 후 재빌드
cd src-tauri
cargo clean
cd ..
bun run tauri build
```

