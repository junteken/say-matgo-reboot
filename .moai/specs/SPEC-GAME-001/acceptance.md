# SPEC-GAME-001: Mat-go Game Logic Core - Acceptance Criteria

---
id: "SPEC-GAME-001"
version: "1.0.0"
status: "planned"
created: "2026-02-28"
updated: "2026-02-28"
author: "oci"
priority: "P0"
tags: ["game", "logic", "core", "mat-go"]
---

## 1. Acceptance Criteria Overview (수락 기준 개요)

### 1.1 Definition of Done (완료 정의)

구현이 완료로 간주되기 위해서는 다음 조건이 모두 충족되어야 합니다:

1. **All Tests Pass**: 모든 테스트 케이스 통과
2. **Code Coverage**: 최소 85% 코드 커버리지
3. **TRUST 5 Compliance**: TRUST 5 품질 기준 충족
4. **Documentation**: 모든 공개 API에 JSDoc 주석
5. **No Lint Errors**: ESLint/TypeScript 에러 없음

### 1.2 Quality Gates (품질 게이트)

| Gate | Threshold | Measurement Method |
|------|-----------|-------------------|
| Test Pass Rate | 100% | Vitest |
| Code Coverage | >= 85% | Vitest --coverage |
| Type Errors | 0 | tsc --noEmit |
| Lint Errors | 0 | ESLint |
| Performance | < 10ms per operation | Vitest benchmark |

## 2. Given-When-Then Scenarios (GWT 시나리오)

### Scenario 1: 카드 덱 생성 (Card Deck Creation)

**Feature:** CardDeck.create()

**Scenario 1.1: 기본 덱 생성**

```gherkin
Given 게임이 시작되지 않은 상태
When 새로운 CardDeck을 생성할 때
Then 정확히 48장의 카드가 생성되어야 한다
And 각 월별 4장의 카드가 포함되어야 한다
And 5장의 광 카드가 포함되어야 한다
```

**Scenario 1.2: 카드 분포 검증**

```gherkin
Given 생성된 48장의 카드 덱
When 각 타입별 카드 수를 집계할 때
Then 광(Kwang): 5장이어야 한다 (비광 포함)
And 열끗(Yulkkut): 9장 (홍단 3장, 청단 3장, 초단 1장, 기본 2장)
And 띠(Tti): 10장
And 피(Pi): 24장 (쌍피 2장 포함)
```

**Scenario 1.3: 시드 기반 셔플**

```gherkin
Given 동일한 시드값 12345
When 두 개의 CardDeck을 시드값으로 생성할 때
Then 두 덱의 카드 순서는 동일해야 한다
```

### Scenario 2: 기본 매칭 (Basic Matching)

**Feature:** CardMatcher.playCard()

**Scenario 2.1: 단일 매칭 (Single Match)**

```gherkin
Given 바닥에 1월 카드 1장이 깔려있는 상태
And 플레이어가 1월 카드를 가지고 있을 때
When 플레이어가 1월 카드를 낼 때
Then 바닥의 1월 카드와 매칭되어야 한다
And 플레이어의 획득 pile에 2장의 카드가 추가되어야 한다
And 바닥에서 해당 카드가 제거되어야 한다
```

**Scenario 2.2: 이중 매칭 (Double Match)**

```gherkin
Given 바닥에 1월 카드 2장이 깔려있는 상태
And 플레이어가 1월 카드를 가지고 있을 때
When 플레이어가 1월 카드를 낼 때
Then 바닥의 1월 카드 2장 모두와 매칭되어야 한다
And 플레이어의 획득 pile에 3장의 카드가 추가되어야 한다
```

**Scenario 2.3: 매칭 실패 (No Match)**

```gherkin
Given 바닥에 1월 카드가 없는 상태
And 플레이어가 1월 카드를 가지고 있을 때
When 플레이어가 1월 카드를 낼 때
Then 매칭되는 카드가 없어야 한다
And 바닥에 낸 카드가 추가되어야 한다
And 플레이어의 획득 pile은 비어있어야 한다
```

### Scenario 3: 쪽 판정 (Jjeok Detection)

**Feature:** CardMatcher.checkJjeok()

**Scenario 3.1: 쪽 발생**

```gherkin
Given 바닥에 3월 카드 2장이 깔려있는 상태
And 상대방의 패에 3월 카드 1장이 있는 상태
And 플레이어가 3월 카드를 낼 때
When 쪽 조건을 확인할 때
Then 쪽이 판정되어야 한다
And 상대방의 피 3장이 플레이어에게 이동해야 한다
```

**Scenario 3.2: 쪽 미발생**

```gherkin
Given 바닥에 3월 카드 1장만 깔려있는 상태
When 플레이어가 3월 카드를 낼 때
Then 쪽이 판정되지 않아야 한다
```

**Scenario 3.3: 쪽 - 상대방 카드 없음**

```gherkin
Given 바닥에 3월 카드 2장이 깔려있는 상태
And 상대방의 패에 3월 카드가 없을 때
When 플레이어가 3월 카드를 낼 때
Then 쪽이 판정되지 않아야 한다 (상대방에게 4번째 카드가 없음)
```

### Scenario 4: 폭탄 및 흔들기 (Bomb and Shake)

**Feature:** SpecialRules

**Scenario 4.1: 폭탄 판정**

```gherkin
Given 플레이어가 같은 월의 카드 4장을 모두 획득한 상태
When 폭탄 조건을 확인할 때
Then 폭탄이 판정되어야 한다
And 추가 3점의 보너스 점수가 부여되어야 한다
```

**Scenario 4.2: 흔들기 조건 확인**

```gherkin
Given 플레이어의 패에 같은 월의 카드 4장이 있는 상태
When 흔들기 조건을 확인할 때
Then 흔들기가 가능해야 한다
And 흔들기 성공 시 2배 배수가 적용되어야 한다
```

**Scenario 4.3: 흔들기 실패**

```gherkin
Given 플레이어가 흔들기를 선언한 상태
And 매칭에 실패했을 때
When 결과를 계산할 때
Then 일반 매칭 규칙이 적용되어야 한다
And 페널티는 없어야 한다
```

### Scenario 5: Go 선언 (Go Declaration)

**Feature:** GoStopSystem.declareGo()

**Scenario 5.1: 첫 Go 선언**

```gherkin
Given 플레이어의 점수가 7점인 상태
When 플레이어가 Go를 선언할 때
Then Go 선언이 성공해야 한다
And goCount가 1로 증가해야 한다
And 배수는 1배여야 한다
```

**Scenario 5.2: Go 선언 불가**

```gherkin
Given 플레이어의 점수가 6점인 상태
When 플레이어가 Go를 선언하려 할 때
Then Go 선언이 거부되어야 한다
And 에러 메시지가 반환되어야 한다
```

**Scenario 5.3: 연속 Go**

```gherkin
Given 플레이어가 2고를 선언한 상태
And 점수가 8점으로 증가했을 때
When 3고를 선언할 때
Then goCount가 3이어야 한다
And 배수는 2배여야 한다
```

### Scenario 6: 3고 배수 적용 (Go Multiplier)

**Feature:** GoStopSystem.calculateGoMultiplier()

**Scenario 6.1: 배수 계산**

```gherkin
Given goCount에 따른 배수표
When 각 goCount별 배수를 계산할 때
Then 0고: 1배
And 1고: 1배
And 2고: 1배
And 3고: 2배
And 4고: 4배
And 5고: 4배 (또는 그 이상)
```

**Scenario 6.2: 최종 점수 계산**

```gherkin
Given 기본 점수 8점
And 3고 상태 (2배 배수)
When 최종 점수를 계산할 때
Then 최종 점수는 16점이어야 한다
```

### Scenario 7: 피박 판정 (Pi-bak Penalty)

**Feature:** PenaltyRules.checkPiBak()

**Scenario 7.1: 피박 발생**

```gherkin
Given 승자의 피 카드가 10장 이상인 상태
And 패자의 피 카드가 0장인 상태
When 게임이 종료될 때
Then 피박이 판정되어야 한다
And 패자에게 -2점 페널티가 적용되어야 한다
```

**Scenario 7.2: 피박 미발생**

```gherkin
Given 승자의 피 카드가 10장 이상인 상태
And 패자의 피 카드가 1장 이상인 상태
When 게임이 종료될 때
Then 피박이 판정되지 않아야 한다
```

### Scenario 8: 총통 승리 (Chongtong Victory)

**Feature:** SpecialRules.checkChongtong()

**Scenario 8.1: 총통 승리**

```gherkin
Given 플레이어가 특정 월의 카드 4장을 모두 획득한 상태
And 카드를 훔치지 않고 자연스럽게 모은 상태
When 총통 조건을 확인할 때
Then 총통 승리가 판정되어야 한다
And 게임이 즉시 종료되어야 한다
And 해당 플레이어가 승자로 확정되어야 한다
```

**Scenario 8.2: 총통 미발생 (훔친 카드 포함)**

```gherkin
Given 플레이어가 특정 월의 카드 4장을 모두 획득한 상태
And 쪽으로 상대방 카드를 훔친 적이 있을 때
When 총통 조건을 확인할 때
Then 총통이 아닌 폭탄으로 판정되어야 한다
```

### Scenario 9: 광박 판정 (Kwang-bak Penalty)

**Feature:** PenaltyRules.checkKwangBak()

**Scenario 9.1: 광박 발생**

```gherkin
Given 승자의 광 카드가 3장 이상인 상태
And 패자의 광 카드가 0장인 상태
When 게임이 종료될 때
Then 광박이 판정되어야 한다
And 패자에게 -3점 페널티가 적용되어야 한다
```

**Scenario 9.2: 비광 포함 광박**

```gherkin
Given 승자의 광 카드 3장 중 비광(12월 광)이 포함된 상태
And 패자의 광 카드가 0장인 상태
When 게임이 종료될 때
Then 광박이 판정되어야 한다
(비광 포함이라도 광박은 적용됨)
```

### Scenario 10: 고박 판정 (Go-bak Penalty)

**Feature:** GoStopSystem.checkGoBak()

**Scenario 10.1: 고박 발생**

```gherkin
Given 플레이어가 Go를 선언한 상태
And 추가 점수 획득 없이 Stop을 선언했을 때
When 게임이 종료될 때
Then 고박이 판정되어야 한다
And 해당 플레이어에게 -2점 페널티가 적용되어야 한다
```

**Scenario 10.2: 고박 미발생**

```gherkin
Given 플레이어가 Go를 선언한 상태
And 추가 점수를 획득한 후 Stop을 선언했을 때
When 게임이 종료될 때
Then 고박이 판정되지 않아야 한다
```

### Scenario 11: 점수 계산 (Score Calculation)

**Feature:** CardScorer.calculateScore()

**Scenario 11.1: 기본 점수 계산**

```gherkin
Given 플레이어가 획득한 카드
And 광 3장, 열끗 5장, 띠 5장, 피 10장
When 점수를 계산할 때
Then 광: 3점
And 열끗: 1점
And 띠: 1점
And 피: 1점
And 총점: 6점
```

**Scenario 11.2: 비광 포함 점수**

```gherkin
Given 플레이어가 획득한 광 3장 중 비광이 포함된 상태
When 점수를 계산할 때
Then 광 점수는 2점이어야 한다 (비광 포함 시 -1점)
```

**Scenario 11.3: 특수 조합 보너스**

```gherkin
Given 플레이어가 홍단 3장, 청단 3장, 초단 1장을 획득한 상태
When 점수를 계산할 때
Then 홍단 보너스: +1점
And 청단 보너스: +1점
And 초단 보너스: +1점
And 총 보너스: +3점
```

### Scenario 12: 쪽 카드 훔치기 (Jjeok Stealing)

**Feature:** CardMatcher.executeJjeok()

**Scenario 12.1: 쪽 실행**

```gherkin
Given 쪽이 판정된 상태
And 상대방의 획득 pile에 피 카드가 있을 때
When 쪽을 실행할 때
Then 상대방의 피 중 상대방이 선택한 3장이 플레이어에게 이동해야 한다
And 이동한 카드는 플레이어의 획득 pile에 추가되어야 한다
```

**Scenario 12.2: 쪽 대상 없음**

```gherkin
Given 쪽이 판정된 상태
And 상대방의 획득 pile에 피 카드가 없을 때
When 쪽을 실행할 때
Then 쪽은 무효화되어야 한다
And 대체 카드를 주지 않아야 한다
```

## 3. Edge Cases (엣지 케이스)

### Edge Case 1: 덱 고갈

```gherkin
Given 덱에 남은 카드가 1장만 있는 상태
When 플레이어가 2장을 뽑으려 할 때
Then 에러가 발생해야 한다
And 에러 메시지에 남은 카드 수가 포함되어야 한다
```

### Edge Case 2: 빈 바닥 상태

```gherkin
Given 바닥에 카드가 없는 상태
When 플레이어가 카드를 낼 때
Then 매칭을 시도하지 않아야 한다
And 카드가 바닥에 깔려야 한다
```

### Edge Case 3: 동시 쪽 발생

```gherkin
Given 양쪽 플레이어 모두 쪽 조건을 만족하는 상태
When 먼저 쪽을 실행하는 플레이어가 있을 때
Then 먼저 선언한 플레이어의 쪽만 유효해야 한다
And 후행 플레이어의 쪽은 무효화되어야 한다
```

### Edge Case 4: 최대 점수 초과

```gherkin
Given 플레이어가 이미 매우 높은 점수를 획득한 상태
When 추가 점수를 계산할 때
Then 점수 오버플로우가 발생하지 않아야 한다
And 안전한 정수 범위 내여야 한다
```

### Edge Case 5: 총통 중복

```gherkin
Given 한 플레이어가 2개 이상의 월에서 총통을 달성한 상태
When 점수를 계산할 때
Then 첫 번째 총통만 유효해야 한다
And 게임은 즉시 종료되어야 한다
```

## 4. Performance Criteria (성능 기준)

### 4.1 Operation Timing

| Operation | Max Time | Measurement Method |
|-----------|----------|-------------------|
| Deck Creation | < 5ms | performance.now() |
| Shuffle | < 10ms | performance.now() |
| Card Matching | < 1ms | performance.now() |
| Score Calculation | < 5ms | performance.now() |
| Penalty Check | < 3ms | performance.now() |

### 4.2 Memory Constraints

- CardDeck instance: < 5KB
- GameState instance: < 10KB
- No memory leaks in repeated operations

### 4.3 Scalability

- Support for 1000+ concurrent game instances
- No shared mutable state between instances

## 5. TRUST 5 Quality Gates (TRUST 5 품질 게이트)

### 5.1 Tested (테스트)

- [ ] Unit tests for all public methods
- [ ] Edge case coverage
- [ ] Integration tests for game flow
- [ ] Minimum 85% code coverage

### 5.2 Readable (가독성)

- [ ] TypeScript strict mode enabled
- [ ] Meaningful variable/function names
- [ ] JSDoc comments on all public APIs
- [ ] ESLint compliance

### 5.3 Unified (통일성)

- [ ] Consistent code style
- [ ] Prettier formatting applied
- [ ] Import order consistency
- [ ] Type definitions centralized

### 5.4 Secured (보안)

- [ ] No eval() or Function() usage
- [ ] Input validation on all public methods
- [ ] No sensitive data logging
- [ ] Immutable public interfaces

### 5.5 Trackable (추적 가능)

- [ ] Semantic versioning
- [ ] Git commit messages follow conventions
- [ ] CHANGELOG.md updated
- [ ] API documentation complete

## 6. Test Coverage Requirements (테스트 커버리지 요구사항)

### 6.1 Module Coverage Targets

| Module | Statement | Branch | Function | Line |
|--------|-----------|--------|----------|------|
| CardDeck | 100% | 90% | 100% | 100% |
| CardMatcher | 95% | 90% | 100% | 95% |
| CardScorer | 95% | 85% | 100% | 95% |
| GoStopSystem | 95% | 90% | 100% | 95% |
| PenaltyRules | 90% | 85% | 100% | 90% |
| SpecialRules | 90% | 85% | 100% | 90% |

### 6.2 Integration Test Requirements

- [ ] Complete game flow (deal → play → score → finish)
- [ ] Go/Stop scenarios
- [ ] All penalty types
- [ ] Special rules (bomb, shake, chongtong)

## 7. Verification Methods (검증 방법)

### 7.1 Automated Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- CardDeck.test.ts

# Watch mode for development
npm run test:watch
```

### 7.2 Manual Verification Checklist

- [ ] All 48 cards present in deck
- [ ] Shuffling produces different orders
- [ ] Seeded shuffle produces same order
- [ ] Matching logic correct for all scenarios
- [ ] Scoring matches expected values
- [ ] Go/Stop flow works correctly
- [ ] Penalties applied correctly
- [ ] Special rules trigger appropriately

### 7.3 Code Review Checklist

- [ ] TypeScript strict mode compliance
- [ ] No any types used
- [ ] All public methods have JSDoc
- [ ] Error handling comprehensive
- [ ] No console.log in production code
- [ ] Immutable data structures where appropriate

## 8. Success Metrics (성공 지표)

### 8.1 Quantitative Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Test Pass Rate | 100% | ___ |
| Code Coverage | >= 85% | ___ |
| Type Errors | 0 | ___ |
| Lint Errors | 0 | ___ |
| Avg Operation Time | < 10ms | ___ |

### 8.2 Qualitative Metrics

- Code is self-documenting
- Easy to extend with new rules
- Clear separation of concerns
- No game state inconsistencies

---

**@MX:SPEC:SPEC-GAME-001**
**@MX:NOTE:** All scenarios must have corresponding tests
