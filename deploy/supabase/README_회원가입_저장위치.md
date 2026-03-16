# 회원가입 데이터 저장 위치

## 두 가지 저장소

| 위치 | 용도 | 보이는 정보 |
|------|------|-------------|
| **Authentication > Users** | 로그인 계정 (이메일·비밀번호) | UID, Display name, Email, Phone(메타데이터), Created at |
| **Table Editor > employees** | 회원가입 폼에서 입력한 **전체 정보** | 이름, 이메일, 전화, 전시장, 팀, 생년월일, 직책, 승인 상태 등 |

회원가입 시 **이름·전화·전시장·팀·생년월일·직책**은 **public.employees** 테이블에 저장됩니다.  
Auth Users에는 로그인에 필요한 최소 정보만 들어갑니다.

## 회원가입 UI에 맞게 테이블 적용하기

1. Supabase 대시보드 → **SQL Editor**
2. `EMPLOYEES_TABLE_SIGNUP_UI.sql` 파일 내용을 붙여넣기 후 **Run**
3. **Table Editor** → **employees** 테이블 선택
4. 회원가입한 직원 목록과 전화·전시장·팀·직책 등이 여기서 확인됩니다.

기존에 다른 마이그레이션(001~005 등)을 이미 실행했다면, 위 SQL은 "없으면 컬럼 추가"만 하므로 중복 실행해도 괜찮습니다.
