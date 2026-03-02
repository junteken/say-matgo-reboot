---
id: "SPEC-NET-001"
version: "1.0.0"
status: "planned"
created: "2026-03-01"
updated: "2026-03-01"
author: "oci"
priority: "high"
tags: ["websocket", "multiplayer", "realtime", "network"]
---

# SPEC-NET-001: 인수 기준 (Acceptance Criteria)

## 1. 인수 기준 개요 (Acceptance Criteria Overview)

### 1.1 Definition of Done

SPEC-NET-001은 다음 모든 조건이 충족될 때 완료로 간주한다:

- [ ] 모든 필수 기능 요구사항이 구현되었다
- [ ] 모든 테스트가 통과한다 (단위, 통합, E2E)
- [ ] 코드 커버리지가 85% 이상이다
- [ ] TRUST 5 품질 게이트를 통과한다
- [ ] 성능 기준(NFR)을 충족한다
- [ ] 보안 검증을 통과한다
- [ ] API 문서가 작성되었다

---

## 2. Given-When-Then 시나리오 (Gherkin Scenarios)

### 2.1 연결 및 인증 (Connection & Authentication)

#### Scenario 2.1.1: 정상 연결

```gherkin
Given 사용자가 유효한 JWT 토큰을 가지고 있다
When Socket.IO 서버에 연결을 시도한다
Then 연결이 성공적으로 수립된다
And authenticated 이벤트를 수신한다
And 사용자의 playerId가 포함된다
```

#### Scenario 2.1.2: 인증 실패

```gherkin
Given 사용자가 만료된 JWT 토큰을 가지고 있다
When Socket.IO 서버에 연결을 시도한다
Then 연결이 거부된다
And authentication_failed 이벤트를 수신한다
And 적절한 에러 메시지를 표시한다
```

#### Scenario 2.1.3: 토큰 없는 연결

```gherkin
Given 사용자가 JWT 토큰 없이 연결을 시도한다
When Socket.IO 서버에 연결을 시도한다
Then 연결이 거부된다
And 인증이 필요하다는 메시지를 표시한다
```

---

### 2.2 방 관리 (Room Management)

#### Scenario 2.2.1: 방 생성 및 참여

```gherkin
Given 사용자가 인증되어 있다
When 새로운 방 ID로 join_room 이벤트를 전송한다
Then 방이 생성된다
And room_joined 이벤트를 수신한다
And 방 ID와 빈 플레이어 목록을 포함한다
```

#### Scenario 2.2.2: 기존 방 참여

```gherkin
Given 사용자 A가 방에 이미 참여해 있다
When 사용자 B가 같은 방 ID로 join_room 이벤트를 전송한다
Then 사용자 B가 방에 참여한다
And 사용자 A는 player_joined 이벤트를 수신한다
And 사용자 B는 player_joined 이벤트를 수신한다
And 방에 두 명의 플레이어가 있다
```

#### Scenario 2.2.3: 꽉 찬 방 참여 시도

```gherkin
Given 방에 2명의 플레이어가 이미 있다
When 새로운 사용자가 방에 참여를 시도한다
Then room_full 이벤트를 수신한다
And 방에 참여하지 못한다
```

#### Scenario 2.2.4: 방 퇴장

```gherkin
Given 사용자가 방에 참여해 있다
When leave_room 이벤트를 전송한다
Then 방에서 제거된다
And 다른 플레이어는 player_left 이벤트를 수신한다
And 플레이어 수가 감소한다
```

#### Scenario 2.2.5: 빈 방 자동 삭제

```gherkin
Given 방에 한 명의 플레이어만 있다
When 해당 플레이어가 방을 나간다
Then 방이 자동으로 삭제된다
And 같은 방 ID로 재참여할 수 없다
```

---

### 2.3 게임 진행 (Game Progression)

#### Scenario 2.3.1: 게임 자동 시작

```gherkin
Given 방이 생성되어 있다
When 두 번째 플레이어가 참여한다
Then game_started 이벤트가 발생한다
And 초기 게임 상태가 포함된다
And 카드가 분배된다
And 첫 번째 플레이어의 차례가 시작된다
```

#### Scenario 2.3.2: 카드 플레이

```gherkin
Given 게임이 진행 중이고 내 차례다
When 유효한 카드로 play_card 이벤트를 전송한다
Then 서버가 카드 플레이를 검증한다
And game_state_updated 이벤트를 수신한다
And 상대방도 같은 이벤트를 수신한다
And 내 손에서 카드가 제거된다
And 바닥에 카드가 추가된다
And 차례가 상대방으로 넘어간다
```

#### Scenario 2.3.3: 잘못된 차례에 카드 플레이

```gherkin
Given 게임이 진행 중이고 상대방 차례다
When 카드로 play_card 이벤트를 전송한다
Then 서버가 요청을 거부한다
And 에러 이벤트를 수신한다
And 게임 상태가 변경되지 않는다
```

#### Scenario 2.3.4: Go 선언

```gherkin
Given 내 점수가 7점 이상이다
When declare_go 이벤트를 전송한다
Then go_declared 이벤트를 수신한다
And Go 횟수가 1 증가한다
And 점수 배수가 적용된다
And 게임이 계속 진행된다
```

#### Scenario 2.3.5: Stop 선언

```gherkin
Given 내 점수가 7점 이상이다
When declare_stop 이벤트를 전송한다
Then stop_declared 이벤트를 수신한다
And 최종 점수가 계산된다
And game_over 이벤트가 발생한다
And 승리자가 표시된다
```

---

### 2.4 연결 관리 (Connection Management)

#### Scenario 2.4.1: 정상 연결 해제

```gherkin
Given 사용자가 방에 참여해 있다
When 브라우저를 닫거나 네트워크를 끊는다
Then 서버가 연결 해제를 감지한다
And player_disconnected 이벤트가 발생한다
And 다른 플레이어에게 알림이 표시된다
```

#### Scenario 2.4.2: 재연결 성공

```gherkin
Given 사용자가 게임 중 연결이 끊겼다
When 30초 이내에 재연결한다
Then 이전 게임 상태가 복원된다
And player_reconnected 이벤트가 발생한다
And 게임이 계속 진행될 수 있다
```

#### Scenario 2.4.3: 재연결 타임아웃

```gherkin
Given 사용자가 게임 중 연결이 끊겼다
When 30초가 지날 때까지 재연결하지 않는다
Then 게임이 종료된다
And 상대방에게 연결 끊김 알림이 표시된다
And 방이 삭제된다
```

#### Scenario 2.4.4: 하트비트

```gherkin
Given WebSocket 연결이 활성화되어 있다
When 10초마다 ping 이벤트를 전송한다
Then 서버가 pong으로 응답한다
And 연결 상태가 업데이트된다
```

---

### 2.5 관전자 모드 (Observer Mode)

#### Scenario 2.5.1: 관전자 참여

```gherkin
Given 진행 중인 게임이 있다
When join_as_observer 이벤트를 전송한다
Then 방에 관전자로 참여한다
And 현재 게임 상태를 수신한다
And 게임 상태 업데이트를 계속 수신한다
And 게임 액션을 전송할 수 없다
```

#### Scenario 2.5.2: 관전자 퇴장

```gherkin
Given 관전자로 방에 참여해 있다
When 연결을 닫는다
Then 게임에 영향을 주지 않는다
And 플레이어 수가 변하지 않는다
```

---

### 2.6 에러 처리 (Error Handling)

#### Scenario 2.6.1: 존재하지 않는 방

```gherkin
Given 사용자가 인증되어 있다
When 존재하지 않는 방 ID로 참여를 시도한다
Then error 이벤트를 수신한다
And "방을 찾을 수 없습니다" 메시지를 표시한다
```

#### Scenario 2.6.2: 잘못된 카드 ID

```gherkin
Given 게임이 진행 중이고 내 차례다
When 내 손에 없는 카드 ID로 play_card를 시도한다
Then error 이벤트를 수신한다
And 게임 상태가 변경되지 않는다
```

#### Scenario 2.6.3: 네트워크 지연

```gherkin
Given 네트워크 지연이 500ms를 초과한다
When 연결 상태를 확인한다
Then connection_unstable 경고가 표시된다
And 재연결을 시도한다
```

---

## 3. 성능 테스트 기준 (Performance Test Criteria)

### 3.1 응답 시간 (Response Time)

| 메트릭 | 목표 | 측정 방법 |
|--------|------|----------|
| 연결 수립 시간 | < 500ms | 테스트 측정 |
| 카드 플레이 지연 | < 100ms (P95) | 테스트 측정 |
| 상태 업데이트 전파 | < 50ms (방 내부) | 테스트 측정 |
| 재연결 시간 | < 5초 | 테스트 측정 |

### 3.2 동시성 테스트 (Concurrency Test)

| 시나리오 | 목표 | 검증 방법 |
|----------|------|----------|
| 동시 게임 세션 | 100개 | 부하 테스트 |
| 동시 연결 | 200개 | 부하 테스트 |
| 메시지 전파 | 모든 세션에 도달 | 통합 테스트 |

---

## 4. 보안 테스트 기준 (Security Test Criteria)

### 4.1 인증 보안 (Authentication Security)

```gherkin
Given 만료된 JWT 토큰을 가진 공격자가 있다
When 서버에 연결을 시도한다
Then 연결이 거부된다
And 어떤 게임 상태도 수신하지 못한다
```

```gherkin
Given 위조된 JWT 토큰을 가진 공격자가 있다
When 서버에 연결을 시도한다
Then 연결이 거부된다
And 서버 로그에 기록된다
```

### 4.2 권한 보안 (Authorization Security)

```gherkin
Given 관전자로 방에 참여했다
When play_card 이벤트를 전송한다
Then 서버가 요청을 거부한다
And error 이벤트를 수신한다
```

```gherkin
Given 플레이어 A가 방에 참여해 있다
When 플레이어 B의 카드를 조작하려 시도한다
Then 서버가 요청을 거부한다
And 원본 상태가 유지된다
```

---

## 5. 품질 게이트 (Quality Gates)

### 5.1 TRUST 5 검증

| 차원 | 검증 항목 | 합격 기준 |
|------|-----------|-----------|
| Tested | 단위 테스트 커버리지 | >= 85% |
| Readable | ESLint 경고 | 0개 |
| Unified | Prettier 포맷 | 100% |
| Secured | 보안 취약점 | 0개 (Critical/High) |
| Trackable | 커밋 메시지 | Conventional 준수 |

### 5.2 LSP 품질 게이트

| 항목 | Run Phase 기준 |
|------|----------------|
| TypeScript 에러 | 0개 |
| TypeScript 경고 | 0개 |
| ESLint 에러 | 0개 |
| ESLint 경고 | 0개 |

---

## 6. 사용자 승인 테스트 (User Acceptance Testing)

### 6.1 알파 테스트 (Internal)

| 시나리오 | 테스트자 | 성공 조건 |
|----------|----------|-----------|
| 기본 게임 플레이 | 개발팀 | 1게임 완료 |
| 재연결 | 개발팀 | 상태 복원 확인 |
| 관전자 모드 | 개발팀 | 게임 관전 가능 |

### 6.2 베타 테스트 (Selected Users)

| 시나리오 | 테스트자 | 성공 조건 |
|----------|----------|-----------|
| 전체 게임 flow | 선별 사용자 10명 | 90% 완료율 |
| 네트워크 오류 복구 | 선별 사용자 10명 | 80% 복구 성공 |
| UI 반응성 | 선별 사용자 10명 | 지연 불만 없음 |

---

## 7. 롤아웃 계획 (Rollout Plan)

### 7.1 단계별 롤아웃

1. **Phase 1 (내부):** 개발팀만 접근 가능
2. **Phase 2 (베타):** 20명 선별 사용자
3. **Phase 3 (소프트):** 10% 전체 사용자
4. **Phase 4 (전체):** 100% 롤아웃

### 7.2 롤백 기준

다음 조건 중 하나가 발생 시 즉시 롤백:

- 치명적인 버그 (게임 진행 불가)
- 보안 사고 발생
- 서버 다운타임 > 5분
- 사용자 불만족도 > 30%

---

*문서 생성일: 2026-03-01*
*최종 업데이트: 2026-03-01*
*버전: 1.0.0*
