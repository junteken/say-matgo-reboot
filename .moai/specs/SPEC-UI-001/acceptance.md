---
id: "SPEC-UI-001"
version: "1.0.0"
status: "planned"
created: "2026-03-04"
updated: "2026-03-04"
author: "oci"
priority: "high"
tags: ["ui", "components", "react", "animation", "accessibility"]
dependencies: ["SPEC-GAME-001", "SPEC-NET-001"]
---

# SPEC-UI-001: UI 컴포넌트 렌더링 시스템 - 인수 기준

## 1. 테스트 시나리오 (Test Scenarios)

### 1.1 카드 컴포넌트 (Card Component)

#### 시나리오 1: 카드 렌더링 (Card Rendering)

**Given:** 사용자가 게임 보드에 접속한다
**When:** 카드가 화면에 표시된다
**Then:** 카드는 월(Month)과 타입(Type)에 따라 올바른 색상과 모양으로 렌더링된다

```typescript
// Test
it('renders card with correct month and type', () => {
  const card: Card = {
    id: '1-kwang-1',
    month: 1,
    type: 'kwang'
  }

  render(<Card card={card} state="face-up" />)

  expect(screen.getByRole('button')).toHaveAttribute('aria-label', '1월 광')
})
```

#### 시나리오 2: 카드 뒷면 렌더링 (Card Back Rendering)

**Given:** 플레이어의 손패에 카드가 있다
**When:** 상대방의 차례이다
**Then:** 상대방의 카드는 뒷면으로 표시된다

```typescript
// Test
it('renders face-down card for opponent', () => {
  const card: Card = {
    id: '1-kwang-1',
    month: 1,
    type: 'kwang'
  }

  render(<Card card={card} state="face-down" isOpponent={true} />)

  expect(screen.getByRole('button')).toHaveAttribute('aria-label', '카드 뒷면')
})
```

#### 시나리오 3: 카드 선택 (Card Selection)

**Given:** 플레이어의 차례이다
**When:** 플레이어가 카드를 클릭한다
**Then:** 카드가 선택 상태로 시각적으로 강조된다

```typescript
// Test
it('selects card on click', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()

  render(<Card card={mockCard} state="face-up" selectable onSelect={onSelect} />)

  await user.click(screen.getByRole('button'))

  expect(onSelect).toHaveBeenCalledWith(mockCard)
})
```

#### 시나리오 4: 키보드 카드 선택 (Keyboard Card Selection)

**Given:** 플레이어의 차례이다
**When:** 플레이어가 Tab 키로 카드에 포커스하고 Enter를 누른다
**Then:** 카드가 선택된다

```typescript
// Test
it('selects card with keyboard', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()

  render(<Card card={mockCard} state="face-up" selectable onSelect={onSelect} />)

  await user.tab()
  await user.keyboard('{Enter}')

  expect(onSelect).toHaveBeenCalledWith(mockCard)
})
```

### 1.2 플레이어 영역 (PlayerArea)

#### 시나리오 5: 플레이어 영역 렌더링 (PlayerArea Rendering)

**Given:** 게임이 시작되었다
**When:** 플레이어 영역이 렌더링된다
**Then:** 플레이어의 손패, 캡처된 카드, 점수가 표시된다

```typescript
// Test
it('renders player area with hand, captured, and score', () => {
  const props: PlayerAreaProps = {
    playerIndex: 1,
    player: { id: 'p1', nickname: 'Player 1' },
    handCards: [mockCard1, mockCard2],
    capturedCards: [mockCard3],
    score: { kwang: 1, yulkkut: 0, tti: 0, pi: 0, go: 0, total: 1 },
    isCurrentPlayer: true
  }

  render(<PlayerArea {...props} />)

  expect(screen.getByText('Player 1')).toBeInTheDocument()
  expect(screen.getAllByRole('button')).toHaveLength(3) // 2 hand + 1 captured
})
```

#### 시나리오 6: 현재 플레이어 강조 (Current Player Highlight)

**Given:** 두 명의 플레이어가 있다
**When:** Player 1의 차례이다
**Then:** Player 1 영역이 시각적으로 강조된다

```typescript
// Test
it('highlights current player', () => {
  const { container } = render(
    <PlayerArea
      playerIndex={1}
      player={{ id: 'p1', nickname: 'Player 1' }}
      handCards={[]}
      capturedCards={[]}
      score={emptyScore}
      isCurrentPlayer={true}
    />
  )

  const playerArea = container.querySelector('[data-player-area="1"]')
  expect(playerArea).toHaveClass('current-player')
})
```

#### 시나리오 7: 손패 카드 비노출 (Hand Cards Privacy)

**Given:** 상대방의 손패 카드가 있다
**When:** 상대방 영역이 렌더링된다
**Then:** 카드 내용이 표시되지 않고 개수만 표시된다

```typescript
// Test
it('hides opponent hand card content', () => {
  render(
    <PlayerArea
      playerIndex={2}
      player={{ id: 'p2', nickname: 'Player 2' }}
      handCards={[mockCard1, mockCard2]} // 상대방 손패
      capturedCards={[]}
      score={emptyScore}
      isCurrentPlayer={false}
      isOpponent={true}
    />
  )

  // 카드 뒷면이 표시되어야 함
  const cardBacks = screen.getAllByLabelText('카드 뒷면')
  expect(cardBacks).toHaveLength(2)
})
```

### 1.3 게임 보드 (GameBoard)

#### 시나리오 8: 게임 보드 초기 렌더링 (GameBoard Initial Rendering)

**Given:** 게임이 시작되었다
**When:** 게임 보드가 렌더링된다
**Then:** 바닥 카드, 두 플레이어 영역, 제어 패널이 표시된다

```typescript
// Test
it('renders game board with all components', () => {
  const gameState: GameState = {
    groundCards: [],
    player1Captured: [],
    player2Captured: [],
    player1Score: { kwang: 0, yulkkut: 0, tti: 0, pi: 0, go: 0, total: 0 },
    player2Score: { kwang: 0, yulkkut: 0, tti: 0, pi: 0, go: 0, total: 0 },
    currentGoCount: 0,
    currentPlayer: 1,
    isGameOver: false,
    winner: null
  }

  render(<GameBoard gameState={gameState} />)

  expect(screen.getByTestId('ground-area')).toBeInTheDocument()
  expect(screen.getAllByTestId(/player-area/)).toHaveLength(2)
  expect(screen.getByTestId('control-panel')).toBeInTheDocument()
})
```

#### 시나리오 9: 카드 플레이 (Card Play)

**Given:** 플레이어의 차례이다
**When:** 플레이어가 손패에서 카드를 클릭한다
**Then:** play_card 이벤트가 전송된다

```typescript
// Test
it('sends play_card event when card is clicked', async () => {
  const onPlayCard = vi.fn()
  const user = userEvent.setup()

  render(
    <GameBoard
      gameState={mockGameState}
      onPlayCard={onPlayCard}
      onDeclareGo={vi.fn()}
      onDeclareStop={vi.fn()}
    />
  )

  const firstCard = screen.getAllByRole('button')[0]
  await user.click(firstCard)

  expect(onPlayCard).toHaveBeenCalledWith(mockCard1)
})
```

#### 시나리오 10: 비활성화된 카드 클릭 (Disabled Card Click)

**Given:** 플레이어의 차례가 아니다
**When:** 플레이어가 카드를 클릭한다
**Then:** 아무 일도 일어나지 않는다

```typescript
// Test
it('does not send play_card event when not player turn', async () => {
  const onPlayCard = vi.fn()
  const user = userEvent.setup()

  const gameState: GameState = {
    ...mockGameState,
    currentPlayer: 2 // Player 2의 차례
  }

  render(
    <GameBoard
      gameState={gameState}
      onPlayCard={onPlayCard}
      onDeclareGo={vi.fn()}
      onDeclareStop={vi.fn()}
    />
  )

  const firstCard = screen.getAllByRole('button')[0]
  await user.click(firstCard)

  expect(onPlayCard).not.toHaveBeenCalled()
})
```

### 1.4 제어 패널 (ControlPanel)

#### 시나리오 11: Go 버튼 활성화 (Go Button Enabled)

**Given:** 플레이어의 점수가 7점 이상이다
**When:** 제어 패널이 렌더링된다
**Then:** Go 버튼이 활성화된다

```typescript
// Test
it('enables Go button when score >= 7', () => {
  const score: Score = {
    kwang: 3,
    yulkkut: 1,
    tti: 1,
    pi: 2,
    go: 0,
    total: 7
  }

  render(<ControlPanel score={score} isCurrentPlayer={true} />)

  expect(screen.getByRole('button', { name: /go/i })).not.toBeDisabled()
})
```

#### 시나리오 12: Go 버튼 비활성화 (Go Button Disabled)

**Given:** 플레이어의 점수가 7점 미만이다
**When:** 제어 패널이 렌더링된다
**Then:** Go 버튼이 비활성화된다

```typescript
// Test
it('disables Go button when score < 7', () => {
  const score: Score = {
    kwang: 2,
    yulkkut: 0,
    tti: 1,
    pi: 2,
    go: 0,
    total: 5
  }

  render(<ControlPanel score={score} isCurrentPlayer={true} />)

  expect(screen.getByRole('button', { name: /go/i })).toBeDisabled()
})
```

#### 시나리오 13: Go 선언 (Declare Go)

**Given:** Go 버튼이 활성화되어 있다
**When:** 플레이어가 Go 버튼을 클릭한다
**Then:** declare_go 이벤트가 전송된다

```typescript
// Test
it('sends declare_go event when Go button clicked', async () => {
  const onDeclareGo = vi.fn()
  const user = userEvent.setup()

  render(
    <ControlPanel
      score={sevenPointScore}
      isCurrentPlayer={true}
      onDeclareGo={onDeclareGo}
    />
  )

  await user.click(screen.getByRole('button', { name: /go/i }))

  expect(onDeclareGo).toHaveBeenCalled()
})
```

### 1.5 애니메이션 (Animation)

#### 시나리오 14: 카드 플립 애니메이션 (Card Flip Animation)

**Given:** 카드가 뒷면 상태이다
**When:** 카드가 앞면으로 전환된다
**Then:** 0.3초 동안 부드러운 플립 애니메이션이 재생된다

```typescript
// Test
it('animates card flip from face-down to face-up', async () => {
  const { rerender } = render(
    <Card card={mockCard} state="face-down" />
  )

  const card = screen.getByRole('button')
  expect(card).toHaveStyle({ transform: 'rotateY(180deg)' })

  rerender(<Card card={mockCard} state="face-up" />)

  // 애니메이션이 완료될 때까지 대기
  await waitFor(() => {
    expect(card).toHaveStyle({ transform: 'rotateY(0deg)' })
  }, { timeout: 500 })
})
```

#### 시나리오 15: 매칭 애니메이션 (Matching Animation)

**Given:** 플레이어가 카드를 냈다
**When:** 바닥에 같은 달의 카드가 있다
**Then:** 매칭된 카드들이 함께 모이는 애니메이션이 재생된다

```typescript
// Test
it('plays matching animation when cards match', () => {
  const onAnimationComplete = vi.fn()

  render(
    <GroundArea
      cards={[mockCard1, mockCard2]}
      isMatching={true}
      onAnimationComplete={onAnimationComplete}
    />
  )

  // 애니메이션 완료 확인
  waitFor(() => {
    expect(onAnimationComplete).toHaveBeenCalled()
  })
})
```

#### 시나리오 16: 점수 업데이트 애니메이션 (Score Update Animation)

**Given:** 점수가 변경된다
**When:** 점수가 업데이트된다
**Then:** 점수가 커졌다가 다시 원래 크기로 돌아오는 애니메이션이 재생된다

```typescript
// Test
it('animates score update', async () => {
  const { rerender } = render(
    <ScoreDisplay score={{ ...emptyScore, total: 5 }} />
  )

  const scoreElement = screen.getByTestId('score-total')

  rerender(<ScoreDisplay score={{ ...emptyScore, total: 7 }} />)

  await waitFor(() => {
    expect(scoreElement).toHaveClass('score-updated')
  })
})
```

### 1.6 반응형 디자인 (Responsive Design)

#### 시나리오 17: 모바일 레이아웃 (Mobile Layout)

**Given:** 화면 너비가 375px이다
**When:** 게임 보드가 렌더링된다
**Then:** 모바일 최적화 레이아웃이 적용된다

```typescript
// Test
it('applies mobile layout at 375px width', () => {
  // 뷰포트 너비 설정
  act(() => {
    window.innerWidth = 375
    window.dispatchEvent(new Event('resize'))
  })

  render(<GameBoard gameState={mockGameState} />)

  const gameBoard = screen.getByTestId('game-board')
  expect(gameBoard).toHaveClass('layout-mobile')
})
```

#### 시나리오 18: 태블릿 레이아웃 (Tablet Layout)

**Given:** 화면 너비가 768px이다
**When:** 게임 보드가 렌더링된다
**Then:** 태블릿 최적화 레이아웃이 적용된다

```typescript
// Test
it('applies tablet layout at 768px width', () => {
  act(() => {
    window.innerWidth = 768
    window.dispatchEvent(new Event('resize'))
  })

  render(<GameBoard gameState={mockGameState} />)

  const gameBoard = screen.getByTestId('game-board')
  expect(gameBoard).toHaveClass('layout-tablet')
})
```

#### 시나리오 19: 데스크톱 레이아웃 (Desktop Layout)

**Given:** 화면 너비가 1920px이다
**When:** 게임 보드가 렌더링된다
**Then:** 데스크톱 최적화 레이아웃이 적용된다

```typescript
// Test
it('applies desktop layout at 1920px width', () => {
  act(() => {
    window.innerWidth = 1920
    window.dispatchEvent(new Event('resize'))
  })

  render(<GameBoard gameState={mockGameState} />)

  const gameBoard = screen.getByTestId('game-board')
  expect(gameBoard).toHaveClass('layout-desktop')
})
```

### 1.7 접근성 (Accessibility)

#### 시나리오 20: ARIA 속성 (ARIA Attributes)

**Given:** 인터랙티브 요소가 있다
**When:** 요소가 렌더링된다
**Then:** 적절한 ARIA 속성이 있다

```typescript
// Test
it('has correct ARIA attributes on card', () => {
  render(<Card card={mockCard} state="face-up" selectable />)

  const card = screen.getByRole('button')
  expect(card).toHaveAttribute('aria-label', '1월 광')
  expect(card).toHaveAttribute('aria-pressed', 'false')
})
```

#### 시나리오 21: 키보드 내비게이션 (Keyboard Navigation)

**Given:** 키보드를 사용하는 사용자다
**When:** Tab 키를 누른다
**Then:** 포커스가 인터랙티브 요소 순서대로 이동한다

```typescript
// Test
it('navigates cards with Tab key', async () => {
  const user = userEvent.setup()

  render(<HandCards cards={[mockCard1, mockCard2, mockCard3]} />)

  // 첫 번째 카드로 포커스 이동
  await user.tab()

  const firstCard = screen.getAllByRole('button')[0]
  expect(firstCard).toHaveFocus()

  // 두 번째 카드로 포커스 이동
  await user.tab()
  const secondCard = screen.getAllByRole('button')[1]
  expect(secondCard).toHaveFocus()
})
```

#### 시나리오 22: 색상 대비비 (Color Contrast)

**Given:** UI가 렌더링되었다
**When:** 색상 대비비를 측정한다
**Then:** 모든 텍스트는 4.5:1 이상의 대비비를 가진다

```typescript
// Test
it('meets color contrast requirements', () => {
  render(<ScoreDisplay score={mockScore} />)

  const scoreText = screen.getByTestId('score-total')

  // 색상 값 가져오기
  const styles = window.getComputedStyle(scoreText)
  const color = styles.color
  const backgroundColor = styles.backgroundColor

  // 대비비 계산 (헬퍼 함수 필요)
  const contrast = calculateContrastRatio(color, backgroundColor)
  expect(contrast).toBeGreaterThanOrEqual(4.5)
})
```

#### 시나리오 23: 스크린 리더 (Screen Reader)

**Given:** 스크린 리더를 사용하는 사용자다
**When:** 카드에 포커스한다
**Then:** 스크린 리더가 카드 정보를 읽는다

```typescript
// Test
it('announces card information to screen reader', async () => {
  const user = userEvent.setup()

  render(<Card card={mockCard} state="face-up" />)

  await user.tab()

  const card = screen.getByRole('button', { name: /1월 광/ })
  expect(card).toBeInTheDocument()
})
```

### 1.8 아바타 (Avatar)

#### 시나리오 24: 아바타 렌더링 (Avatar Rendering)

**Given:** 플레이어 영역이 렌더링된다
**When:** 아바타가 있다
**Then:** 아바타가 플레이어 영역에 표시된다

```typescript
// Test
it('renders avatar in player area', () => {
  render(
    <PlayerArea
      playerIndex={1}
      player={{ id: 'p1', nickname: 'Player 1', avatarId: 'avatar-1' }}
      handCards={[]}
      capturedCards={[]}
      score={emptyScore}
      isCurrentPlayer={true}
    />
  )

  const avatar = screen.getByTestId('player-avatar')
  expect(avatar).toBeInTheDocument()
})
```

#### 시나리오 25: 아바타 표정 변경 (Avatar Expression Change)

**Given:** 게임 중이다
**When:** 플레이어가 카드를 매칭한다
**Then:** 아바타가 만족스러운 표정으로 변경된다

```typescript
// Test
it('changes avatar expression on match', async () => {
  const { rerender } = render(
    <AvatarReaction emotion="neutral" />
  )

  expect(screen.getByTestId('avatar-emotion')).toHaveAttribute('data-emotion', 'neutral')

  rerender(<AvatarReaction emotion="happy" />)

  await waitFor(() => {
    expect(screen.getByTestId('avatar-emotion')).toHaveAttribute('data-emotion', 'happy')
  })
})
```

---

## 2. 품질 게이트 (Quality Gates)

### 2.1 기능적 품질 (Functional Quality)

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| 카드 렌더링 | 100% 정확도 | 시각적 테스트 |
| 상태 동기화 | < 100ms 지연 | Performance API |
| 이벤트 전송 | 100% 성공률 | 로그 분석 |
| 애니메이션 | 60fps | Chrome DevTools |

### 2.2 비기능적 품질 (Non-Functional Quality)

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| WCAG 2.1 AA | 100% 준수 | Axe DevTools |
| 키보드 내비게이션 | 모든 기능 | 수동 테스트 |
| 색상 대비비 | 4.5:1 이상 | Contrast Checker |
| 반응형 디자인 | 320px ~ 1920px | 뷰포트 테스트 |

### 2.3 성능 품질 (Performance Quality)

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| 초기 렌더링 | < 2s | Lighthouse |
| 번들 크기 | < 500KB | Bundle Analyzer |
| 프레임률 | 60fps | Performance Monitor |
| 메모리 사용량 | < 100MB | Chrome DevTools |

---

## 3. 정의 완료 (Definition of Done)

### 3.1 구현 완료 기준 (Implementation Done)

- [x] 모든 필수 기능이 구현되었다
- [x] 모든 단위 테스트가 통과한다
- [x] 커버리지가 85% 이상이다
- [x] LSP 오류가 0개이다
- [x] Lint 오류가 0개이다

### 3.2 테스트 완료 기준 (Testing Done)

- [x] 모든 시나리오 테스트가 통과한다
- [x] E2E 테스트가 통과한다
- [x] 접근성 감사가 통과한다
- [x] 성능 테스트가 기준을 충족한다

### 3.3 문서화 완료 기준 (Documentation Done)

- [x] 모든 컴포넌트에 JSDoc이 있다
- [x] @MX 태그가 적절히 추가되었다
- [x] 스토리북이 있다 (선택)

---

## 4. 검증 방법 (Verification Methods)

### 4.1 자동화된 테스트 (Automated Tests)

- Vitest 단위 테스트
- React Testing Library 통합 테스트
- Playwright E2E 테스트

### 4.2 수동 테스트 (Manual Tests)

- 다양한 브라우저 테스트
- 모바일 기기 테스트
- 키보드 내비게이션 테스트
- 스크린 리더 테스트

### 4.3 도구 기반 검증 (Tool-Based Verification)

- Axe DevTools (접근성)
- Lighthouse (성능)
- Bundle Analyzer (번들 크기)
- Chrome DevTools (프로파일링)

---

*문서 생성일: 2026-03-04*
*최종 업데이트: 2026-03-04*
*버전: 1.0.0*
