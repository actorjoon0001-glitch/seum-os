# Supabase에서 해야 할 설정 (세움 OS)

아래 순서대로 Supabase 대시보드에서 진행하면 됩니다.

---

## 1. Storage (파일 업로드용 버킷)

**경로: Supabase 대시보드 → Storage → New bucket**

### 1) `contract_files` 버킷 (계약서 + 설계 도면)

- **이름:** `contract_files`
- **Public bucket:** 체크 권장 (또는 아래 Policy로 인증 사용자만 읽기)
- **용도:**  
  - 계약서 첨부 (영업팀)  
  - 협의도면 첨부 (설계팀)  
  - 시공도면 첨부 (설계팀)

**버킷 생성 후 Policies:**

- Storage → `contract_files` → Policies → New Policy
- **INSERT:** `authenticated` 역할만 업로드 허용  
  - Policy definition: `(bucket_id = 'contract_files') AND (auth.role() = 'authenticated')`
- **SELECT:** 링크로 공개 보기 허용  
  - Public bucket이면 자동. 비공개면 `authenticated` 등으로 읽기 허용

> 이미 `contract_files` 버킷이 있고, `contracts/` 경로만 쓰고 있었다면  
> **추가 설정 없이** `design_drawings/`, `construction_drawings/` 경로도 같은 버킷에 업로드됩니다.

---

### 2) `notice_files` 버킷 (공지 첨부)

- **이름:** `notice_files`
- **Public bucket:** 체크 권장
- **용도:** 공지사항 첨부파일
- Policies: 인증 사용자 INSERT/SELECT (공지 업로드·보기용)

---

## 2. Database (테이블 / SQL)

**경로: Supabase 대시보드 → SQL Editor → New query → Run**

### 2-1. 계약 동기화용 컬럼 (한 번만 실행)

`supabase/contracts_sync.sql` 내용을 SQL Editor에 붙여넣고 Run:

- `contracts` 테이블에 `local_id`, `showroom_id`, `contract_date`, `contract_amount`, `sales_person`, `customer_name`, `model_name`, `payload` 등 추가
- 이미 적용했으면 생략

### 2-2. 공지·첨부·댓글·읽음 (필요 시)

- **announcements** 테이블: 공지사항 (id, title, content, created_at, important, is_new 등)
- **notice_files** 테이블: `supabase/migrations/007_notice_files.sql` 실행
- **notice_files RLS:** `supabase/migrations/008_notice_files_rls.sql` 실행
- **notice_reads** 테이블: `supabase/migrations/006_notice_reads.sql` 실행
- **notice_comments** 테이블: 공지 댓글용 (코드에서 사용 중이면 생성)

### 2-3. 기타 앱에서 쓰는 테이블

- **employees** – 직원 (로그인/팀/전시장 등): `APPLY_THIS_IN_SUPABASE.sql` 참고
- **team_events** – 운영 캘린더 일정
- **activity_logs** – 활동 로그
- **showrooms** – 전시장
- **customers** – 고객 (관리자용)

(이미 프로젝트에서 다른 SQL로 만들었으면 그대로 사용)

---

## 3. 정리 체크리스트

| 구분 | 항목 | 확인 |
|------|------|------|
| Storage | `contract_files` 버킷 생성 | ☐ |
| Storage | `contract_files` 인증 사용자 업로드(INSERT) 허용 | ☐ |
| Storage | `notice_files` 버킷 생성 (공지 첨부용) | ☐ |
| DB | `contracts` 테이블에 payload 등 컬럼 (contracts_sync.sql) | ☐ |
| DB | announcements, notice_files, notice_reads 등 (필요한 migration 실행) | ☐ |
| DB | employees, team_events 등 앱에서 쓰는 테이블 존재 | ☐ |

---

## 4. 문제 발생 시

- **계약서/협의도면/시공도면 업로드 실패**
  - Storage → `contract_files` → Policies에서  
    `auth.role() = 'authenticated'` 로 INSERT 허용 policy 있는지 확인
  - 버킷 이름이 정확히 `contract_files` 인지 확인

- **공지 첨부 업로드 실패**
  - `notice_files` 버킷 존재 여부 및 Policy 확인

- **계약 목록이 안 불러와짐**
  - Table Editor에서 `contracts` 테이블에 `local_id`, `payload` 컬럼 있는지 확인
  - `contracts_sync.sql` 미실행 시 실행

이 가이드는 `supabase/` 폴더의 SQL·migration 파일과 앱 코드(Storage 버킷명·테이블명)를 기준으로 작성되었습니다.
