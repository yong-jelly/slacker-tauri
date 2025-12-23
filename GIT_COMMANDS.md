# Git 명령어 가이드 - 작업 보존 및 복원

## 현재 작업 보존하고 이전 커밋으로 이동하기

### 1단계: 현재 변경사항을 stash에 저장
```bash
git stash push -m "위젯 모드 UI 개선 작업 중"
```

### 2단계: 이전 커밋 상태로 이동
```bash
# 최신 커밋 이전으로 이동 (현재 HEAD의 부모)
git checkout HEAD~1

# 또는 특정 커밋으로 이동
git checkout dcd9101
```

### 3단계: 다시 현재 작업 상태로 돌아오기
```bash
# 원래 브랜치로 돌아가기
git checkout main

# 저장했던 작업 복원
git stash pop
```

## 더 안전한 방법: 임시 브랜치 사용

### 1단계: 현재 작업을 임시 브랜치에 커밋
```bash
# 현재 변경사항 커밋
git add src/widgets/layout/AppLayout.tsx
git commit -m "WIP: 위젯 모드 UI 개선 작업 중"

# 또는 stash 사용
git stash push -m "위젯 모드 UI 개선 작업 중"
```

### 2단계: 이전 커밋으로 이동
```bash
git checkout HEAD~1
# 또는
git checkout dcd9101
```

### 3단계: 다시 현재 상태로 돌아오기
```bash
# 원래 브랜치로 돌아가기
git checkout main

# stash를 사용했다면
git stash pop
```

## 빠른 복원 명령어 (한 줄로)

```bash
# 현재 상태 저장 → 이전 커밋으로 이동
git stash && git checkout HEAD~1

# 다시 현재 상태로 복원
git checkout main && git stash pop
```

## 참고사항

- `git stash`는 변경사항을 임시 저장소에 보관합니다
- `git stash pop`은 stash를 적용하고 삭제합니다
- `git stash apply`는 stash를 적용하지만 삭제하지 않습니다
- `git stash list`로 저장된 stash 목록을 확인할 수 있습니다
- `git stash drop`으로 stash를 삭제할 수 있습니다


