# 세움OS 채팅 – Supabase Realtime 사용 여부 분석

## 1. chat.js 내 Realtime 관련 코드 여부

**결과: 없음**

- `supabase.channel()` → **없음**
- `postgres_changes` → **없음**
- Realtime subscription 관련 코드 → **없음**

`chat.js`는 Supabase 클라이언트를 사용하지 않습니다.  
채팅 데이터는 전부 **localStorage** (`seum_chat`, `seum_chat_contract`, `seum_chat_last_read`, `seum_chat_contract_read`) 에만 저장·조회됩니다.

---

## 2. messages 테이블 INSERT 구독 여부

**결과: 없음**

- 채팅용 **Supabase 테이블이 없음** (예: `messages`, `chat_messages` 등).
- 따라서 **INSERT 이벤트 구독도 없음**.

채팅 메시지는 DB에 저장되지 않고, 브라우저 localStorage에만 저장됩니다.

---

## 3. 현재 채팅 메시지 업데이트 방식

Realtime이 없으므로, **같은 브라우저/같은 탭** 안에서만 갱신됩니다.

### 팀 채팅 (채널: all, headquarters, showroom1 등)

| 단계 | 동작 |
|------|------|
| 1 | 사용자가 전송 → `doSendMessage()` (chat-ui.js) |
| 2 | `window.saveChatMessage(ch, msg)` → **localStorage**에 메시지 추가 (chat.js) |
| 3 | `renderChatMessageList(ch)` 즉시 호출 → **같은 화면** 메시지 목록 다시 그리기 |
| 4 | `setChatLastRead()`, `updateChatTabBadges()`, `renderChatRoomList()` 호출 |

즉, **메시지 전송 직후 같은 클라이언트에서만 `renderChatMessageList` 재실행**하는 방식입니다.

- **Polling(일정 시간마다 조회)** 없음  
- **서버에서 메시지 다시 불러오기** 없음  
- **새로고침** 시 해당 기기 localStorage 기준으로만 보임  

### 계약 채팅

| 단계 | 동작 |
|------|------|
| 1 | 전송 시 `window.saveContractChatMessage(cid, msg)` → **localStorage** |
| 2 | `renderContractChat(cid, 'chat-message-list')` 즉시 호출 |

동일하게 **전송 후 같은 클라이언트에서만 UI 갱신**입니다.

### Supabase 사용처 (채팅 기준)

- **chat-ui.js**  
  - `uploadChatFiles()` 에서만 `seumSupabase` 사용  
  - `storage.from('notice_files').upload()` 로 **첨부파일 업로드**만 수행  
  - 메시지 저장/동기화/구독 없음  

---

## 4. Supabase Realtime으로 실시간 채팅 구현 제안

다른 기기·다른 사용자에게도 메시지가 실시간으로 보이게 하려면, **메시지를 Supabase 테이블에 저장하고 Realtime으로 구독**하는 방식이 필요합니다.

### 4.1 DB 설계

**팀 채팅용 테이블 (예: `team_chat_messages`)**

```sql
create table team_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null,           -- 'all', 'headquarters', 'showroom1' 등
  sender_id text not null,
  sender_name text,
  sender_team text,
  message_type text default 'text', -- 'text', 'image', 'file'
  text_content text,
  file_url text,
  file_name text,
  created_at timestamptz default now()
);

-- Realtime 활성화 (Supabase 대시보드 또는 SQL)
alter publication supabase_realtime add table team_chat_messages;
```

**계약 채팅용 테이블 (예: `contract_chat_messages`)**

```sql
create table contract_chat_messages (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null,
  sender_id text not null,
  sender_name text,
  message text,
  type text default 'user',        -- 'user', 'system'
  is_deleted boolean default false,
  is_pinned boolean default false,
  pinned_at timestamptz,
  pinned_by text,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table contract_chat_messages;
```

RLS 정책은 팀/계약 권한에 맞게 작성해야 합니다.

---

### 4.2 클라이언트 구현 흐름

#### A. 메시지 전송 시

- **기존**: `saveChatMessage()` / `saveContractChatMessage()` → localStorage만
- **변경**:
  1. `supabase.from('team_chat_messages').insert(...)` 또는  
     `supabase.from('contract_chat_messages').insert(...)` 로 **DB에 INSERT**
  2. (선택) 성공 시 로컬 캐시(localStorage 또는 메모리)에 보관 후  
     `renderChatMessageList()` / `renderContractChat()` 호출  
  3. Realtime 구독 중인 다른 클라이언트는 **아래 구독**으로 자동 수신

#### B. Realtime 구독 (chat.js 또는 전용 realtime 모듈)

**팀 채팅 – 특정 채널만 구독**

```javascript
var supabase = window.seumSupabase;
if (!supabase) return;

var channel = supabase
  .channel('team-chat-' + channelName)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'team_chat_messages',
      filter: 'channel=eq.' + channelName
    },
    function (payload) {
      var row = payload.new;
      // 로컬 스토어에 추가 후 renderChatMessageList(channelName) 호출
      appendMessageToStore(channelName, row);
      if (typeof window.renderChatMessageList === 'function') {
        window.renderChatMessageList(channelName);
      }
    }
  )
  .subscribe();
```

**계약 채팅 – 특정 계약만 구독**

```javascript
var channel = supabase
  .channel('contract-chat-' + contractId)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'contract_chat_messages',
      filter: 'contract_id=eq.' + contractId
    },
    function (payload) {
      var row = payload.new;
      appendContractMessageToStore(contractId, row);
      if (typeof window.renderContractChat === 'function') {
        window.renderContractChat(contractId, 'chat-message-list');
      }
    }
  )
  .subscribe();
```

- 채널/계약별로 `channel`을 나누면, **해당 채널/계약만** INSERT 이벤트를 받을 수 있습니다.
- `appendMessageToStore` / `appendContractMessageToStore` 는 기존 `getChatStore()` / `getContractChatStore()` 구조에 맞춰 메시지를 추가하는 함수로 두면 됩니다.

#### C. 초기 로딩

- **팀 채팅**: 패널 오픈 시  
  `supabase.from('team_chat_messages').select('*').eq('channel', channelName).order('created_at')`  
  로 과거 메시지 조회 후, 그 결과로 스토어를 채우고 `renderChatMessageList(channelName)` 호출.
- **계약 채팅**: 계약 채팅 모달 오픈 시  
  `supabase.from('contract_chat_messages').select('*').eq('contract_id', contractId).order('created_at')`  
  로 조회 후 동일하게 스토어 + `renderContractChat(contractId, ...)`.

이후에는 **Realtime INSERT**로 새 메시지만 추가하면 됩니다.

---

### 4.3 적용 순서 제안

1. **Supabase**
   - `team_chat_messages`, `contract_chat_messages` 테이블 생성
   - Realtime publication에 두 테이블 추가
   - RLS 정책 설정

2. **chat.js**
   - DB INSERT/SELECT를 사용하는 함수 추가 (또는 기존 함수를 DB 연동으로 교체)
   - Realtime 구독 함수 추가: 채널/계약별 `supabase.channel().on('postgres_changes', { event: 'INSERT', ... })`
   - 기존 localStorage 기반 API(`getChatStore`, `getContractChatMessages` 등)는 필요 시 “캐시 + DB” 형태로 유지

3. **chat-ui.js**
   - 전송 시 `saveChatMessage` / `saveContractChatMessage` 대신 또는 함께  
     `supabase.from('...').insert(...)` 호출
   - 채팅 패널/계약 채팅 오픈 시 위의 “초기 로딩” 쿼리 호출 및 구독 시작
   - 닫을 때 `.unsubscribe()` 로 정리

4. **마이그레이션**
   - 기존 localStorage 데이터를 한 번 DB로 이관할지, “앞으로부터만 DB”로 할지 정책 결정 후 적용

---

## 요약

| 항목 | 현재 상태 |
|------|-----------|
| chat.js에 `supabase.channel()` / postgres_changes / Realtime | **없음** |
| messages(또는 채팅용) 테이블 INSERT 구독 | **없음** (채팅용 테이블 자체 없음) |
| 현재 업데이트 방식 | 전송 후 **같은 클라이언트에서만** `renderChatMessageList` / `renderContractChat` 재실행 (localStorage 기반, Polling/서버 재조회 없음) |
| Realtime 도입 시 | 위와 같이 **테이블 + INSERT 구독 + 전송 시 INSERT** 로 실시간 반영 가능 |

위 구조로 적용하면 Supabase Realtime을 사용해 채팅 메시지가 실시간으로 업데이트되도록 할 수 있습니다.
