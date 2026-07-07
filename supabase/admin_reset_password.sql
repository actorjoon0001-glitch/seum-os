-- ============================================================
-- 관리자 직원 비밀번호 초기화 RPC (이메일/SMTP 불필요)
-- ------------------------------------------------------------
-- 세움os 관리자(employees.permission in admin/master 또는 지정 관리자 이메일)가
-- 직원 비밀번호를 지정값(예: 000000)으로 초기화한다.
-- 이후 직원이 그 임시비밀번호로 로그인해 '비밀번호 변경'에서 직접 바꾼다.
--
-- 보안:
--  - service_role 키를 프론트에 두지 않고, SECURITY DEFINER 함수가 서버(DB)에서
--    권한을 확인한 뒤에만 auth.users 를 갱신한다.
--  - 함수 실행은 로그인 사용자(authenticated)만 가능하고, 내부에서 관리자 여부를
--    다시 확인하므로 일반 직원은 호출해도 거부된다.
--  - 비밀번호는 GoTrue 호환 bcrypt 해시로 저장.
-- Supabase SQL Editor 에서 1회 실행.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_reset_employee_password(target_email text, new_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  caller_email text := lower(auth.jwt() ->> 'email');
  is_admin boolean := false;
  target_id uuid;
begin
  if caller_email is null or caller_email = '' then
    return json_build_object('success', false, 'error', '로그인이 필요합니다.');
  end if;

  -- 관리자 여부: employees.permission(또는 role) 이 admin/master 이거나 지정 관리자 이메일
  select (
    exists (
      select 1 from public.employees e
      where lower(e.email) = caller_email
        and lower(coalesce(e.permission, e.role, '')) in ('admin', 'master')
    )
    or caller_email in ('harold0001@naver.com', 'actorjoon0001@gmail.com')
  ) into is_admin;

  if not is_admin then
    return json_build_object('success', false, 'error', '관리자 권한이 없습니다.');
  end if;

  if new_password is null or length(new_password) < 6 then
    return json_build_object('success', false, 'error', '비밀번호는 6자 이상이어야 합니다.');
  end if;

  select id into target_id from auth.users where lower(email) = lower(target_email) limit 1;
  if target_id is null then
    return json_build_object('success', false, 'error', '해당 이메일의 계정을 찾을 수 없습니다.');
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
         updated_at = now()
   where id = target_id;

  return json_build_object('success', true);
end;
$$;

-- 일반/익명 실행 차단, 로그인 사용자에게만 실행 허용(내부에서 관리자 재확인)
revoke all on function public.admin_reset_employee_password(text, text) from public;
revoke all on function public.admin_reset_employee_password(text, text) from anon;
grant execute on function public.admin_reset_employee_password(text, text) to authenticated;
