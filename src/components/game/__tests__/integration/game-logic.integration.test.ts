/**
 * Integration Tests: Game Logic with UI Components
 *
 * Comprehensive integration tests verifying that game logic from SPEC-GAME-001
 * integrates correctly with UI components from SPEC-UI-001.
 *
 * Test Scenarios:
 * 1. Card component renders correct visual based on Card type (kwang, yulkkut, tti, pi)
 * 2. PlayerArea displays correct score when cards are captured
 * 3. ControlPanel Go button activates when score reaches 7+
 * 4. GoStopSystem multipliers are correctly calculated and displayed
 * 5. Penalty rules are correctly applied and shown in UI
 *
 * @MX:SPEC: SPEC-UI-001, SPEC-GAME-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { Card } from '../../cards/Card'
import { PlayerArea } from '../../player/PlayerArea'
import { ScoreDisplay } from '../../player/ScoreDisplay'
import { ControlPanel } from '../../board/ControlPanel'
import { GameBoard } from '../../board/GameBoard'
import { CardDeck } from '@/lib/game/core/CardDeck'
import { CardScorer } from '@/lib/game/core/CardScorer'
import { GoStopSystem } from '@/lib/game/core/GoStopSystem'
import { PenaltyRules } from '@/lib/game/core/PenaltyRules'
import type { Card, Score } from '@/lib/game/types/game.types'
import { GO_THRESHOLD } from '@/lib/game/constants/card.constants'

/**
 * Test Suite 1: Card Component Integration with Game Logic Types
 */
describe('Card Component - Game Logic Type Integration', () => {
  describe('Card Type Visual Representation', () => {
    it('should display kwang cards with correct visual', () => {
      const kwangCard: Card = { month: 1, type: 'kwang', id: '1-kwang-0' }
      const mockClick = vi.fn()

      render(<Card card={kwangCard} size="medium" isSelected={false} onClick={mockClick} />)

      const card = screen.getByRole('button', { name: '1월 광' })
      expect(card).toBeInTheDocument()

      // Verify visual representation
      const monthNumber = within(card).getByText('1')
      const typeLabel = within(card).getByText('광')

      expect(monthNumber).toBeInTheDocument()
      expect(typeLabel).toBeInTheDocument()
      expect(typeLabel).toHaveClass('text-red-600') // Kwang is red
    })

    it('should display yulkkut cards with correct visual', () => {
      const yulkkutCard: Card = { month: 1, type: 'yulkkut', id: '1-yulkkut-0' }
      const mockClick = vi.fn()

      render(<Card card={yulkkutCard} size="medium" isSelected={false} onClick={mockClick} />)

      const card = screen.getByRole('button', { name: '1월 열' })
      const typeLabel = within(card).getByText('열')

      expect(typeLabel).toHaveClass('text-blue-600') // Yulkkut is blue
    })

    it('should display tti cards with correct visual', () => {
      const ttiCard: Card = { month: 1, type: 'tti', id: '1-tti-0' }
      const mockClick = vi.fn()

      render(<Card card={ttiCard} size="medium" isSelected={false} onClick={mockClick} />)

      const card = screen.getByRole('button', { name: '1월 띠' })
      const typeLabel = within(card).getByText('띠')

      expect(typeLabel).toHaveClass('text-yellow-600') // Tti is yellow
    })

    it('should display pi cards with correct visual', () => {
      const piCard: Card = { month: 1, type: 'pi', id: '1-pi-0' }
      const mockClick = vi.fn()

      render(<Card card={piCard} size="medium" isSelected={false} onClick={mockClick} />)

      const card = screen.getByRole('button', { name: '1월 피' })
      const typeLabel = within(card).getByText('피')

      expect(typeLabel).toHaveClass('text-gray-600') // Pi is gray
    })
  })

  describe('Card Month Display', () => {
    it('should display all 12 months correctly', () => {
      for (let month = 1; month <= 12; month++) {
        const card: Card = { month: month as Card['month'], type: 'pi', id: `${month}-pi-0` }
        const mockClick = vi.fn()

        const { unmount } = render(
          <Card card={card} size="medium" isSelected={false} onClick={mockClick} />
        )

        const cardElement = screen.getByRole('button', { name: `${month}월 피` })
        const monthNumber = within(cardElement).getByText(String(month))

        expect(monthNumber).toBeInTheDocument()
        unmount()
      }
    })
  })

  describe('Card Interaction', () => {
    it('should trigger onClick with correct card data', () => {
      const testCard: Card = { month: 5, type: 'kwang', id: '5-kwang-0' }
      const mockClick = vi.fn()

      render(<Card card={testCard} size="medium" isSelected={false} onClick={mockClick} />)

      const card = screen.getByRole('button', { name: '5월 광' })
      fireEvent.click(card)

      expect(mockClick).toHaveBeenCalledTimes(1)
      expect(mockClick).toHaveBeenCalledWith(testCard)
    })

    it('should support keyboard navigation', () => {
      const testCard: Card = { month: 5, type: 'tti', id: '5-tti-0' }
      const mockClick = vi.fn()

      render(<Card card={testCard} size="medium" isSelected={false} onClick={mockClick} />)

      const card = screen.getByRole('button')
      fireEvent.keyDown(card, { key: 'Enter' })

      expect(mockClick).toHaveBeenCalledTimes(1)
      expect(mockClick).toHaveBeenCalledWith(testCard)
    })

    it('should show selection state visually', () => {
      const testCard: Card = { month: 3, type: 'yulkkut', id: '3-yulkkut-0' }
      const mockClick = vi.fn()

      const { rerender } = render(
        <Card card={testCard} size="medium" isSelected={false} onClick={mockClick} />
      )

      const card = screen.getByRole('button')
      expect(card).not.toHaveClass('border-highlight')

      rerender(<Card card={testCard} size="medium" isSelected={true} onClick={mockClick} />)

      expect(card).toHaveClass('border-highlight')
    })
  })
})

/**
 * Test Suite 2: ScoreDisplay Integration with CardScorer
 */
describe('ScoreDisplay - CardScorer Integration', () => {
  let scorer: CardScorer

  beforeEach(() => {
    scorer = new CardScorer()
  })

  describe('Score Breakdown Display', () => {
    it('should display score calculated by CardScorer', () => {
      // Create test cards: 3 kwang, 5 yulkkut, 5 tti, 10 pi
      const capturedCards: Card[] = [
        ...Array.from({ length: 3 }, (_, i) => ({ month: (i + 1) as Card['month'], type: 'kwang' as const, id: `${i + 1}-kwang-0` })),
        ...Array.from({ length: 5 }, (_, i) => ({ month: (i + 1) as Card['month'], type: 'yulkkut' as const, id: `${i + 1}-yulkkut-0` })),
        ...Array.from({ length: 5 }, (_, i) => ({ month: (i + 1) as Card['month'], type: 'tti' as const, id: `${i + 1}-tti-0` })),
        ...Array.from({ length: 10 }, (_, i) => ({ month: ((i % 12) + 1) as Card['month'], type: 'pi' as const, id: `${i}-pi-0` })),
      ]

      const score = scorer.calculateScore(capturedCards)

      render(<ScoreDisplay score={score} size="medium" />)

      // Verify each score type is displayed
      expect(screen.getByText('광')).toBeInTheDocument()
      expect(screen.getByText('열')).toBeInTheDocument()
      expect(screen.getByText('띠')).toBeInTheDocument()
      expect(screen.getByText('피')).toBeInTheDocument()
      expect(screen.getByText('총점')).toBeInTheDocument()

      // Verify score values
      expect(screen.getByText('3')).toBeInTheDocument() // Kwang score
      expect(screen.getByText('1')).toBeInTheDocument() // Yulkkut score
      expect(screen.getByText('1')).toBeInTheDocument() // Tti score
      expect(screen.getByText('1')).toBeInTheDocument() // Pi score
      expect(screen.getByText('6점')).toBeInTheDocument() // Total
    })

    it('should display zero scores correctly', () => {
      const emptyScore: Score = {
        kwang: 0,
        yulkkut: 0,
        tti: 0,
        pi: 0,
        go: 0,
        total: 0,
      }

      render(<ScoreDisplay score={emptyScore} size="medium" />)

      expect(screen.getByText('0점')).toBeInTheDocument()
    })

    it('should display Go count when greater than zero', () => {
      const scoreWithGo: Score = {
        kwang: 3,
        yulkkut: 1,
        tti: 1,
        pi: 0,
        go: 2,
        total: 7,
      }

      render(<ScoreDisplay score={scoreWithGo} size="medium" />)

      expect(screen.getByText('고')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should not display Go count when zero', () => {
      const scoreWithoutGo: Score = {
        kwang: 3,
        yulkkut: 1,
        tti: 1,
        pi: 0,
        go: 0,
        total: 5,
      }

      render(<ScoreDisplay score={scoreWithoutGo} size="medium" />)

      const goLabels = screen.queryAllByText('고')
      expect(goLabels.length).toBe(0)
    })
  })

  describe('Special Combination Scores', () => {
    it('should display 5 Kwang score (chongtong-like)', () => {
      const fiveKwangCards: Card[] = Array.from({ length: 5 }, (_, i) => ({
        month: (i + 1) as Card['month'],
        type: 'kwang' as const,
        id: `${i + 1}-kwang-0`,
      }))

      const score = scorer.calculateScore(fiveKwangCards)

      render(<ScoreDisplay score={score} size="medium" />)

      expect(screen.getByText('15')).toBeInTheDocument() // 5 Kwang = 15 points
    })

    it('should display 3 Kwang with Bi-kwang penalty', () => {
      const threeKwangWithBi: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 12, type: 'kwang', id: '12-kwang-0' }, // Bi-kwang (December)
      ]

      const score = scorer.calculateScore(threeKwangWithBi)

      render(<ScoreDisplay score={score} size="medium" />)

      // 3 Kwang with Bi-kwang = 2 points (3 - 1 penalty)
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
})

/**
 * Test Suite 3: PlayerArea Integration with Game State
 */
describe('PlayerArea - Game State Integration', () => {
  describe('Score Update on Card Capture', () => {
    it('should update displayed score when cards are captured', () => {
      const scorer = new CardScorer()

      const initialCaptured: Card[] = []
      const initialScore = scorer.calculateScore(initialCaptured)

      const newCaptured: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
      ]
      const newScore = scorer.calculateScore(newCaptured)

      const { rerender } = render(
        <PlayerArea
          playerName="Player 1"
          handCards={[]}
          capturedCards={initialCaptured}
          score={initialScore}
          isCurrentPlayer={true}
          orientation="bottom"
        />
      )

      // Initial score should be 0
      expect(screen.getByText('0점')).toBeInTheDocument()

      // Update with new captured cards and score
      rerender(
        <PlayerArea
          playerName="Player 1"
          handCards={[]}
          capturedCards={newCaptured}
          score={newScore}
          isCurrentPlayer={true}
          orientation="bottom"
        />
      )

      // New score should be 3 (3 Kwang)
      expect(screen.getByText('3점')).toBeInTheDocument()
    })
  })

  describe('Hand and Captured Cards Display', () => {
    it('should display correct number of hand cards', () => {
      const handCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
        { month: 2, type: 'pi', id: '2-pi-0' },
        { month: 3, type: 'pi', id: '3-pi-0' },
      ]

      render(
        <PlayerArea
          playerName="Player 1"
          handCards={handCards}
          capturedCards={[]}
          score={{ kwang: 0, yulkkut: 0, tti: 0, pi: 0, go: 0, total: 0 }}
          isCurrentPlayer={true}
          orientation="bottom"
        />
      )

      // Verify hand cards are rendered
      handCards.forEach((card) => {
        expect(screen.getByRole('button', { name: `${card.month}월 피` })).toBeInTheDocument()
      })
    })

    it('should display captured cards', () => {
      const capturedCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
      ]

      render(
        <PlayerArea
          playerName="Player 1"
          handCards={[]}
          capturedCards={capturedCards}
          score={{ kwang: 0, yulkkut: 0, tti: 0, pi: 0, go: 0, total: 0 }}
          isCurrentPlayer={true}
          orientation="bottom"
        />
      )

      // Verify captured cards are rendered
      expect(screen.getByRole('button', { name: '1월 광' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '2월 열' })).toBeInTheDocument()
    })
  })
})

/**
 * Test Suite 4: ControlPanel Integration with GoStopSystem
 */
describe('ControlPanel - GoStopSystem Integration', () => {
  describe('Go Button Activation', () => {
    it('should enable Go button when score reaches threshold', () => {
      const goSystem = new GoStopSystem()
      goSystem.setBaseScore(GO_THRESHOLD) // Score of 7

      const mockGo = vi.fn()
      const mockStop = vi.fn()

      render(
        <ControlPanel
          canGo={goSystem.canDeclareGo(GO_THRESHOLD)}
          canStop={true}
          goCount={0}
          onGo={mockGo}
          onStop={mockStop}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      expect(goButton).not.toBeDisabled()
    })

    it('should disable Go button when score is below threshold', () => {
      const goSystem = new GoStopSystem()
      const lowScore = 5
      goSystem.setBaseScore(lowScore)

      const mockGo = vi.fn()
      const mockStop = vi.fn()

      render(
        <ControlPanel
          canGo={goSystem.canDeclareGo(lowScore)}
          canStop={false}
          goCount={0}
          onGo={mockGo}
          onStop={mockStop}
        />
      )

      const goButton = screen.getByRole('button', { name: /고.*비활성화/ })
      expect(goButton).toBeDisabled()
    })
  })

  describe('Go Declaration Flow', () => {
    it('should update Go count display after declaration', () => {
      const goSystem = new GoStopSystem()
      goSystem.setBaseScore(GO_THRESHOLD)

      const result1 = goSystem.declareGo()
      const result2 = goSystem.declareGo()

      const mockGo = vi.fn()
      const mockStop = vi.fn()

      const { rerender } = render(
        <ControlPanel
          canGo={true}
          canStop={true}
          goCount={result1.goCount}
          onGo={mockGo}
          onStop={mockStop}
        />
      )

      expect(screen.getByText('1고')).toBeInTheDocument()

      rerender(
        <ControlPanel
          canGo={true}
          canStop={true}
          goCount={result2.goCount}
          onGo={mockGo}
          onStop={mockStop}
        />
      )

      expect(screen.getByText('2고')).toBeInTheDocument()
    })

    it('should call Go callback when button is clicked', () => {
      const mockGo = vi.fn()
      const mockStop = vi.fn()

      render(
        <ControlPanel canGo={true} canStop={true} goCount={0} onGo={mockGo} onStop={mockStop} />
      )

      const goButton = screen.getByRole('button', { name: /고$/ })
      fireEvent.click(goButton)

      expect(mockGo).toHaveBeenCalledTimes(1)
    })

    it('should call Stop callback when button is clicked', () => {
      const mockGo = vi.fn()
      const mockStop = vi.fn()

      render(
        <ControlPanel canGo={true} canStop={true} goCount={0} onGo={mockGo} onStop={mockStop} />
      )

      const stopButton = screen.getByRole('button', { name: /스톱/ })
      fireEvent.click(stopButton)

      expect(mockStop).toHaveBeenCalledTimes(1)
    })
  })

  describe('Multiplier Display', () => {
    it('should display correct multiplier after multiple Go declarations', () => {
      const goSystem = new GoStopSystem()
      goSystem.setBaseScore(GO_THRESHOLD)

      // Declare Go 3 times
      goSystem.declareGo()
      goSystem.declareGo()
      goSystem.declareGo()

      const stopResult = goSystem.declareStop()

      expect(stopResult.goCount).toBe(3)
      expect(stopResult.multiplier).toBe(4) // 3 Go = 4x multiplier
      expect(stopResult.finalScore).toBeGreaterThan(GO_THRESHOLD)
    })

    it('should calculate maximum multiplier for 5+ Go', () => {
      const goSystem = new GoStopSystem()
      goSystem.setBaseScore(GO_THRESHOLD)

      // Declare Go 5 times
      for (let i = 0; i < 5; i++) {
        goSystem.declareGo()
      }

      const stopResult = goSystem.declareStop()

      expect(stopResult.goCount).toBe(5)
      expect(stopResult.multiplier).toBe(15) // 5+ Go = 15x multiplier
    })
  })
})

/**
 * Test Suite 5: GameBoard Integration with Complete Game Flow
 */
describe('GameBoard - Complete Game Flow Integration', () => {
  describe('Initial Game State', () => {
    it('should display initial board with ground cards', () => {
      const groundCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
        { month: 2, type: 'pi', id: '2-pi-0' },
      ]

      const mockGo = vi.fn()
      const mockStop = vi.fn()
      const mockGroundClick = vi.fn()

      render(
        <GameBoard
          groundCards={groundCards}
          canGo={false}
          canStop={false}
          goCount={0}
          currentPlayer={1}
          isGameOver={false}
          winner={null}
          connectionQuality="excellent"
          onGo={mockGo}
          onStop={mockStop}
          onGroundCardClick={mockGroundClick}
        />
      )

      // Verify ground cards are displayed
      expect(screen.getByRole('button', { name: '1월 피' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '2월 피' })).toBeInTheDocument()

      // Verify controls are disabled initially
      expect(screen.getByRole('button', { name: /고.*비활성화/ })).toBeDisabled()
      expect(screen.getByRole('button', { name: /스톱.*비활성화/ })).toBeDisabled()
    })
  })

  describe('Game Progression', () => {
    it('should enable controls when player reaches Go threshold', () => {
      const mockGo = vi.fn()
      const mockStop = vi.fn()
      const mockGroundClick = vi.fn()

      const { rerender } = render(
        <GameBoard
          groundCards={[]}
          canGo={false}
          canStop={false}
          goCount={0}
          currentPlayer={1}
          isGameOver={false}
          winner={null}
          connectionQuality="excellent"
          onGo={mockGo}
          onStop={mockStop}
          onGroundCardClick={mockGroundClick}
        />
      )

      // Initially disabled
      expect(screen.getByRole('button', { name: /고.*비활성화/ })).toBeDisabled()

      // Player reaches threshold
      rerender(
        <GameBoard
          groundCards={[]}
          canGo={true}
          canStop={true}
          goCount={0}
          currentPlayer={1}
          isGameOver={false}
          winner={null}
          connectionQuality="excellent"
          onGo={mockGo}
          onStop={mockStop}
          onGroundCardClick={mockGroundClick}
        />
      )

      // Now enabled
      const goButton = screen.getByRole('button', { name: /고$/ })
      expect(goButton).not.toBeDisabled()
    })
  })

  describe('Game Over State', () => {
    it('should display winner when game is over', () => {
      render(
        <GameBoard
          groundCards={[]}
          canGo={false}
          canStop={false}
          goCount={0}
          currentPlayer={1}
          isGameOver={true}
          winner={1}
          connectionQuality="excellent"
          onGo={vi.fn()}
          onStop={vi.fn()}
        />
      )

      expect(screen.getByText(/승리/)).toBeInTheDocument()
    })
  })
})

/**
 * Test Suite 6: Penalty Rules Integration
 */
describe('Penalty Rules - UI Integration', () => {
  let penaltyRules: PenaltyRules

  beforeEach(() => {
    penaltyRules = new PenaltyRules()
  })

  describe('Penalty Detection', () => {
    it('should detect pi-bak when loser fails to get 10+ pi', () => {
      const winnerCards: Card[] = Array.from({ length: 15 }, (_, i) => ({
        month: ((i % 12) + 1) as Card['month'],
        type: 'pi' as const,
        id: `pi-${i}`,
      }))

      const loserCards: Card[] = Array.from({ length: 3 }, (_, i) => ({
        month: (i + 1) as Card['month'],
        type: 'pi' as const,
        id: `loser-pi-${i}`,
      }))

      const penalties = penaltyRules.checkPenalties(winnerCards, loserCards)

      const piBak = penalties.find((p) => p.type === 'pi-bak')
      expect(piBak).toBeDefined()
      expect(piBak?.points).toBe(2)
    })

    it('should detect kwang-bak when loser fails to get 3+ kwang and winner has 3+ kwang', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang' },
        { month: 2, type: 'kwang', id: '2-kwang' },
        { month: 3, type: 'kwang', id: '3-kwang' },
      ]

      const loserCards: Card[] = [
        { month: 4, type: 'yulkkut', id: '4-yulkkut' },
        { month: 5, type: 'yulkkut', id: '5-yulkkut' },
      ]

      const penalties = penaltyRules.checkPenalties(winnerCards, loserCards)

      const kwangBak = penalties.find((p) => p.type === 'kwang-bak')
      expect(kwangBak).toBeDefined()
      expect(kwangBak?.points).toBe(3)
    })

    it('should detect meong-bak when loser scores zero', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang' },
        { month: 2, type: 'kwang', id: '2-kwang' },
        { month: 3, type: 'kwang', id: '3-kwang' },
      ]

      const loserCards: Card[] = []

      const penalties = penaltyRules.checkPenalties(winnerCards, loserCards)

      const meongBak = penalties.find((p) => p.type === 'meong-bak')
      expect(meongBak).toBeDefined()
      expect(meongBak?.points).toBe(2)
    })
  })

  describe('Penalty Display in Score', () => {
    it('should include penalty in final score display', () => {
      const penalties = [
        { type: 'pi-bak' as const, points: 2, description: '피박' },
        { type: 'kwang-bak' as const, points: 3, description: '광박' },
      ]

      const totalPenalty = penaltyRules.calculatePenalty(penalties)

      expect(totalPenalty).toBe(5)
    })
  })
})

/**
 * Test Suite 7: CardDeck Integration with Card Display
 */
describe('CardDeck - Card Component Integration', () => {
  describe('Deck Creation and Card Display', () => {
    it('should create 48 cards with correct types', () => {
      const deck = new CardDeck()
      deck.create()

      expect(deck.remaining()).toBe(48)
    })

    it('should deal cards that display correctly in UI', () => {
      const deck = new CardDeck(42) // Seeded for reproducibility
      deck.create()
      deck.shuffle()

      const dealtCards = deck.deal(10)

      const mockClick = vi.fn()

      // Render each dealt card
      dealtCards.forEach((card) => {
        render(<Card card={card} size="medium" isSelected={false} onClick={mockClick} />)
        expect(
          screen.getByRole('button', { name: `${card.month}월 ${card.type === 'kwang' ? '광' : card.type === 'yulkkut' ? '열' : card.type === 'tti' ? '띠' : '피'}` })
        ).toBeInTheDocument()
      })
    })

    it('should provide unique IDs for each card', () => {
      const deck = new CardDeck()
      deck.create()

      const cards: Card[] = []
      while (deck.remaining() > 0) {
        cards.push(...deck.deal(1))
      }

      const uniqueIds = new Set(cards.map((c) => c.id))
      expect(uniqueIds.size).toBe(48) // All IDs should be unique
    })
  })
})

/**
 * Test Suite 8: End-to-End Game Scenario
 */
describe('End-to-End Game Scenario Integration', () => {
  it('should simulate complete game flow with scoring and Go/Stop', () => {
    const deck = new CardDeck(42)
    deck.create()
    deck.shuffle()

    const scorer = new CardScorer()
    const goSystem = new GoStopSystem()

    // Deal initial cards
    const player1Hand = deck.deal(10)
    const player2Hand = deck.deal(10)
    const groundCards = deck.deal(8)

    // Simulate player 1 capturing some cards
    const player1Captured = [...player1Hand.slice(0, 3), ...groundCards.slice(0, 2)]
    const player1Score = scorer.calculateScore(player1Captured)

    // Set up Go system
    goSystem.setBaseScore(player1Score.total)

    // Check if player can declare Go
    const canDeclareGo = goSystem.canDeclareGo(player1Score.total)

    // Render game state
    const mockGo = vi.fn()
    const mockStop = vi.fn()

    render(
      <GameBoard
        groundCards={groundCards}
        canGo={canDeclareGo}
        canStop={canDeclareGo}
        goCount={0}
        currentPlayer={1}
        isGameOver={false}
        winner={null}
        connectionQuality="excellent"
        onGo={mockGo}
        onStop={mockStop}
      />
    )

    // Verify game state
    expect(screen.getByRole('main', { name: '게임 보드' })).toBeInTheDocument()
  })

  it('should handle Go declaration and score multiplier calculation', () => {
    const scorer = new CardScorer()
    const goSystem = new GoStopSystem()

    // Player has high score
    const capturedCards: Card[] = [
      ...Array.from({ length: 3 }, (_, i) => ({ month: (i + 1) as Card['month'], type: 'kwang' as const, id: `${i + 1}-kwang` })),
      ...Array.from({ length: 5 }, (_, i) => ({ month: (i + 1) as Card['month'], type: 'yulkkut' as const, id: `${i + 1}-yulkkut` })),
    ]

    const score = scorer.calculateScore(capturedCards)
    goSystem.setBaseScore(score.total)

    // Declare Go twice
    const goResult1 = goSystem.declareGo()
    expect(goResult1.success).toBe(true)
    expect(goResult1.goCount).toBe(1)

    const goResult2 = goSystem.declareGo()
    expect(goResult2.success).toBe(true)
    expect(goResult2.goCount).toBe(2)

    // Stop and calculate final score
    const stopResult = goSystem.declareStop()

    expect(stopResult.goCount).toBe(2)
    expect(stopResult.multiplier).toBe(2) // 2 Go = 2x
    expect(stopResult.finalScore).toBeGreaterThan(score.total)
  })
})
