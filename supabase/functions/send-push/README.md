# send-push Edge Function

`notifications` 테이블 INSERT 트리거가 호출하는 Web Push 발송 함수.

## 1. VAPID 키 발급 (1회)

로컬에서 한 번만 실행:

```bash
npx web-push generate-vapid-keys
```

출력된 `Public Key` / `Private Key` 두 개를 보관.

## 2. 시크릿 등록

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY=<public_key> \
  VAPID_PRIVATE_KEY=<private_key> \
  VAPID_SUBJECT=mailto:admin@seum-os.com
```

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 는 Edge Function 런타임이
자동 주입하므로 별도 설정 불필요.

## 3. 함수 배포

```bash
supabase functions deploy send-push --no-verify-jwt
```

`--no-verify-jwt` 는 DB 트리거에서 service_role_key 로 호출하므로 OK.

## 4. DB 트리거 설정 (마이그레이션 036)

```sql
ALTER DATABASE postgres SET app.settings.edge_url
  = 'https://<PROJECT-REF>.supabase.co/functions/v1/send-push';
ALTER DATABASE postgres SET app.settings.service_role_key
  = '<SERVICE_ROLE_KEY>';
```

위 GUC 두 개를 먼저 적용한 뒤, `036_notifications_push_trigger.sql` 마이그레이션
실행.

## 5. 클라이언트 VAPID 공개키 주입

`dashboard.html` 의 `<meta name="seum-vapid-public-key" content="...">` 의
content 를 1번에서 받은 **Public Key** 로 교체.

## 6. 동작 확인

1. dashboard.html 진입 → 브라우저 알림 권한 허용
2. `push_subscriptions` 테이블에 endpoint 행이 1개 추가되는지 확인
3. 다른 계정에서 LG가전 발주 신규 등록 → 본인 디바이스에 OS 푸시 도착 확인
4. 탭 닫고도 도착하면 성공
