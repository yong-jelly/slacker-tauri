#!/bin/bash

# 미루미(MIRUMI) 빌드 스크립트
# 사용법: ./build.sh

set -e  # 오류 발생 시 스크립트 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 미루미(MIRUMI) 빌드 시작...${NC}"

# 프로젝트 루트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cargo.toml에서 버전 추출
APP_VERSION=$(grep -E '^version\s*=' src-tauri/Cargo.toml | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
if [ -z "$APP_VERSION" ]; then
    echo -e "${RED}❌ 버전을 찾을 수 없습니다. Cargo.toml을 확인하세요.${NC}"
    exit 1
fi

echo -e "${GREEN}📌 버전: ${APP_VERSION}${NC}"

# 오늘 날짜 (yyyymmdd 형식)
TODAY=$(date +%Y%m%d)

# 1. 기존 빌드 캐시 삭제
echo -e "${YELLOW}📦 빌드 캐시 정리 중...${NC}"
rm -rf dist
rm -rf src-tauri/target
echo -e "${GREEN}✅ 캐시 정리 완료${NC}"

# 2. 프론트엔드 빌드
echo -e "${YELLOW}🔨 프론트엔드 빌드 중...${NC}"
bun run build
echo -e "${GREEN}✅ 프론트엔드 빌드 완료${NC}"

# 3. Tauri 빌드
echo -e "${YELLOW}🔨 Tauri 빌드 중...${NC}"
bun run tauri build
echo -e "${GREEN}✅ Tauri 빌드 완료${NC}"

# 4. dist 폴더 생성 및 DMG 파일 복제
echo -e "${YELLOW}📁 배포 파일 준비 중...${NC}"
mkdir -p dist

# DMG 파일 찾기 및 복제 (날짜 추가)
# mirumi_0.1.0_aarch64
DMG_SOURCE="src-tauri/target/release/bundle/dmg/mirumi_${APP_VERSION}_aarch64.dmg"
DMG_DEST="dist/mirumi_${APP_VERSION}_aarch64_${TODAY}.dmg"

if [ -f "$DMG_SOURCE" ]; then
    cp "$DMG_SOURCE" "$DMG_DEST"
    echo -e "${GREEN}✅ DMG 파일 복제 완료: ${DMG_DEST}${NC}"
else
    echo -e "${RED}❌ DMG 파일을 찾을 수 없습니다: ${DMG_SOURCE}${NC}"
    exit 1
fi

# 5. 결과 요약
echo ""
echo -e "${GREEN}🎉 빌드 완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  📌 버전: ${APP_VERSION}"
echo -e "  📦 DMG: ${DMG_DEST}"
echo -e "  📁 앱: src-tauri/target/release/bundle/macos/mirumi.app"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 파일 크기 출력
if [ -f "$DMG_DEST" ]; then
    SIZE=$(du -h "$DMG_DEST" | cut -f1)
    echo -e "  💾 크기: ${SIZE}"
fi

echo ""

