---
name: ship-to-main
description: 현재 브랜치의 커밋된 작업을 항상 "새 PR"로 만들어 main에 자동 머지한다. 작업을 배포/반영/머지/올려달라고 할 때, 또는 기능 구현을 끝낸 뒤 main에 반영해야 할 때 사용.
---

# ship-to-main — 새 PR로 main 자동 머지

이 저장소의 표준 배포 흐름. 커밋된 변경을 **매번 새 PR**로 만들어 main에 머지한다.
main 머지 = Netlify 자동 배포(`netlify.toml`: push 시 `build-deploy.sh` 빌드 → `deploy/` 배포).

## 전제
- 변경은 이미 커밋되어 있어야 한다(작업 브랜치 위에서). 커밋 안 됐으면 먼저 커밋.
- 지정 작업 브랜치에서 진행한다. main에 직접 커밋/푸시하지 않는다.
- `deploy/` 는 빌드 산출물 → 손대지 않는다(루트 파일만 수정).

## 절차
1. **최신 main 반영**: `git fetch origin main`. 브랜치가 main보다 뒤처졌거나 충돌 가능성이 있으면
   `git checkout -B <branch> origin/main` 후 변경을 다시 얹거나 `git rebase origin/main` 으로 정렬.
   - 병렬 작업이 같은 자리를 건드렸는지 항상 확인(`git log --oneline <base>..origin/main`).
     이미 main에 유사 구현/placeholder가 있으면 **덮어쓰지 말고 그 위에서 조정**(중복 메뉴/섹션 금지).
2. **푸시**: `git push -u origin <branch>` (리베이스로 히스토리 바뀌었으면 `--force-with-lease`).
   네트워크 실패 시 2s·4s·8s·16s 백오프로 최대 4회 재시도.
3. **새 PR 생성**: `mcp__github__create_pull_request` (owner=actorjoon0001-glitch, repo=seum-os,
   head=<branch>, base=main). 매번 새 PR — 이미 머지된 PR을 재사용하지 않는다.
4. **자동 머지**: `mcp__github__enable_pr_auto_merge` 시도 →
   저장소에 auto-merge 가 꺼져 있으면(에러) `mcp__github__merge_pull_request` (merge_method=merge)로 즉시 머지.
5. **충돌 시**: 머지가 `merge conflicts` 로 실패하면 1번(최신 main 위로 리베이스/재작성)으로 돌아가
   충돌을 해소하고 force-with-lease 재푸시 후 다시 머지. 자동 해소가 애매하면 사용자에게 확인.
6. **후속 작업**: 머지 후 이어서 작업하면 `git fetch origin main && git checkout -B <branch> origin/main`
   로 브랜치를 최신 main에서 다시 시작(머지된 PR에 커밋을 쌓지 않는다).

## 주의
- main = 프로덕션(라이브 사이트). 머지 즉시 배포되므로 커밋 내용이 배포 가능한 상태인지 확인.
- Supabase 스키마 변경(SQL)은 코드 배포와 별개 — 콘솔에서 직접 실행해야 반영됨(자동 아님).
