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

# SPEC-UI-001: UI Component Rendering System - Execution Plan

## Executive Summary

This execution plan details the implementation of a comprehensive UI component system for the Say Mat-go Reboot card game. The implementation transforms the current server-only codebase into a full-stack application with React 19, Next.js 15, and Framer Motion animations.

**Critical Discovery:** The current project is a Node.js server with no frontend framework. This plan includes Phase 0 for infrastructure setup as a critical prerequisite.

**Total Effort Estimate:** 12 hours across 9 phases
**Total Tasks:** 38 atomic implementation tasks
**Risk Level:** Medium-High (due to infrastructure gap)

---

## 1. Plan Summary

### 1.1 Overview

Implement a complete UI component rendering system for the Mat-go card game including:

- **Card Components:** Individual card rendering with state management (face-up, face-down, selected, disabled)
- **Player Areas:** Hand cards, captured cards, score display, avatar integration
- **Game Board:** Central game area with ground cards, turn indicators, control panel
- **Animation System:** Framer Motion-based animations for card flips, matching, score updates
- **Avatar System:** Character display with emotion reactions to game events
- **Responsive Design:** Mobile (320px+), tablet (768px+), desktop (1024px+) layouts
- **Accessibility:** WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Performance:** 60fps animations, <500KB bundle size, <2s initial render

### 1.2 Implementation Approach

**Methodology:** TDD (Test-Driven Development) using RED-GREEN-REFACTOR cycle

**Development Strategy:** Sequential phased implementation with incremental validation

**Quality Framework:** TRUST 5 compliance (Tested, Readable, Unified, Secured, Trackable)

---

## 2. Requirements

### 2.1 Functional Requirements

#### Card Component (FR-CD-001 to FR-CD-005)
- [ ] FR-CD-001: Cards are visually distinguished by month and type
- [ ] FR-CD-002: Cards have face-up/face-down states
- [ ] FR-CD-003: Cards show selected/hover/disabled states
- [ ] FR-CD-004: Cards are clickable and keyboard selectable
- [ ] FR-CD-005: Cards render as SVG icons or images

#### Player Area (FR-PA-001 to FR-PA-003)
- [ ] FR-PA-001: Player area displays hand cards, captured cards, and score
- [ ] FR-PA-002: Current player is visually highlighted
- [ ] FR-PA-003: Player area displays avatar

#### Game Board (FR-GB-001 to FR-GB-004)
- [ ] FR-GB-001: Game board includes ground cards, player areas, score panel
- [ ] FR-GB-002: Game board layout adjusts responsively
- [ ] FR-GB-003: Game board animates state transitions
- [ ] FR-GB-004: Game board supports spectator mode

#### Control Panel (FR-CP-001 to FR-CP-003)
- [ ] FR-CP-001: Control panel includes Go/Stop buttons
- [ ] FR-CP-002: Go/Stop buttons enable/disable based on conditions
- [ ] FR-CP-003: Control panel displays current score and Go count

#### Avatar (FR-AV-001 to FR-AV-003)
- [ ] FR-AV-001: Avatar displays full-body character
- [ ] FR-AV-002: Avatar changes expression based on game events
- [ ] FR-AV-003: Avatar expresses win/lose emotions

### 2.2 Non-Functional Requirements

#### Performance (NFR-P-001 to NFR-P-004)
- [ ] NFR-P-001: Maintain 60fps during animations
- [ ] NFR-P-002: UI response latency < 100ms
- [ ] NFR-P-003: Initial render < 2s (First Contentful Paint)
- [ ] NFR-P-004: Bundle size < 500KB (gzipped)

#### Accessibility (NFR-A-001 to NFR-A-004)
- [ ] NFR-A-001: WCAG 2.1 AA compliance (100%)
- [ ] NFR-A-002: Keyboard navigation for all functions
- [ ] NFR-A-003: Color contrast ratio >= 4.5:1
- [ ] NFR-A-004: Screen reader support (NVDA, VoiceOver)

#### Responsive Design (NFR-R-001 to NFR-R-003)
- [ ] NFR-R-001: Mobile support (320px ~ 767px)
- [ ] NFR-R-002: Tablet support (768px ~ 1023px)
- [ ] NFR-R-003: Desktop support (1024px+)

---

## 3. Success Criteria

### 3.1 Phase Completion Criteria

**Phase 0 (Infrastructure):**
- Next.js 15 dev server runs without errors
- Tailwind CSS classes render correctly
- Framer Motion animations work
- React Testing Library renders components
- TypeScript compiles with zero errors

**Phase 1 (Card Components):**
- Card renders correct month/type visuals
- All card states are visually distinct
- Keyboard navigation works
- 100% of test scenarios pass
- LSP: 0 errors, 0 warnings

**Phase 2 (Player Area):**
- PlayerArea displays all required elements
- Current player highlighting works
- Score formatting is accurate
- All test scenarios pass
- LSP: 0 errors, 0 warnings

**Phase 3 (Game Board):**
- GameBoard renders complete state
- Card clicks trigger play_card events
- Go/Stop buttons enable/disable correctly
- WebSocket events update UI
- All test scenarios pass
- LSP: 0 errors, 0 warnings

**Phase 4 (Animation):**
- Card flip animates smoothly (0.3s)
- Matching animations trigger
- Score changes have visual feedback
- 60fps maintained

**Phase 5 (Avatar):**
- Avatar displays in player area
- Emotions change on game events
- Win/lose reactions work

**Phase 6 (Responsive):**
- Mobile layout (375px) functional
- Tablet layout (768px) optimized
- Desktop layout (1920px) expanded
- Touch interactions work

**Phase 7 (Accessibility):**
- All interactive elements have ARIA attributes
- Full keyboard navigation functional
- Color contrast >= 4.5:1 verified
- Screen reader announces state
- Axe DevTools: 0 violations

**Phase 8 (Optimization):**
- Bundle size < 500KB gzipped
- FCP < 2s
- 60fps maintained
- No memory leaks

### 3.2 Quality Gates (TRUST 5)

- **Tested:** 85%+ code coverage, all tests passing
- **Readable:** Clear naming, ESLint clean, JSDoc complete
- **Unified:** Prettier formatted, consistent patterns
- **Secured:** Input validation, event sanitization
- **Trackable:** Conventional commits, SPEC references

---

## 4. Effort Estimate

### 4.1 Phase Breakdown

| Phase | Description | Tasks | Estimate | Priority |
|-------|-------------|-------|----------|----------|
| Phase 0 | Infrastructure Setup | 5 | 2 hours | CRITICAL |
| Phase 1 | Card Components | 5 | 2 hours | Primary |
| Phase 2 | Player Area | 4 | 1.5 hours | Primary |
| Phase 3 | Game Board | 6 | 2.5 hours | Primary |
| Phase 4 | Animation System | 4 | 1 hour | Secondary |
| Phase 5 | Avatar System | 3 | 1 hour | Secondary |
| Phase 6 | Responsive Design | 3 | 1 hour | Primary |
| Phase 7 | Accessibility | 4 | 1 hour | Primary |
| Phase 8 | Optimization | 4 | 1 hour | Secondary |
| **Total** | | **38** | **13 hours** | |

### 4.2 Complexity Assessment

- **Low Complexity:** Phases 5, 6 (straightforward implementation)
- **Medium Complexity:** Phases 1, 2, 4, 8 (requires careful state management)
- **High Complexity:** Phase 0 (infrastructure change), Phase 3 (complex state integration), Phase 7 (compliance requirements)

### 4.3 Risk-Adjusted Estimate

Considering infrastructure gap and complexity:
- **Optimistic:** 10 hours (everything goes smoothly)
- **Realistic:** 13 hours (expected challenges)
- **Pessimistic:** 16 hours (unforeseen issues)

---

## 5. Phases

### Phase 0: Infrastructure Setup (CRITICAL PREREQUISITE)

**Objective:** Transform server-only codebase into full-stack application

**Dependencies:** None (must be first)

**Tasks:**
- [ ] TASK-UI-001: Add Next.js 15 + React 19 to project dependencies
- [ ] TASK-UI-002: Configure Tailwind CSS with PostCSS
- [ ] TASK-UI-003: Install and configure Framer Motion
- [ ] TASK-UI-004: Create component directory structure (src/components/game/, src/components/avatar/, etc.)
- [ ] TASK-UI-005: Configure React Testing Library

**Deliverables:**
- Working Next.js dev server
- Tailwind config with theme
- Component directory structure
- Test rendering setup

**Success Criteria:**
- `npm run dev` starts Next.js server
- Tailwind classes apply styles
- Test component renders
- Zero TypeScript errors

---

### Phase 1: Card Components

**Objective:** Implement core card rendering system

**Dependencies:** Phase 0

**Tasks:**
- [ ] TASK-UI-006: Implement Card component with face-up/face-down/selected/disabled states
- [ ] TASK-UI-007: Implement CardBack component
- [ ] TASK-UI-008: Implement HandCards container component
- [ ] TASK-UI-009: Implement CapturedCards container component
- [ ] TASK-UI-010: Write Card component tests (4 scenarios)

**Deliverables:**
- `src/components/game/cards/Card.tsx`
- `src/components/game/cards/CardBack.tsx`
- `src/components/game/cards/HandCards.tsx`
- `src/components/game/cards/CapturedCards.tsx`
- `src/components/game/cards/*.test.tsx`

**Success Criteria:**
- Card displays correct month/type
- States are visually distinct
- Keyboard accessible
- All tests pass

---

### Phase 2: Player Area

**Objective:** Implement player area with score and avatar integration

**Dependencies:** Phase 1

**Tasks:**
- [ ] TASK-UI-011: Implement ScoreDisplay component
- [ ] TASK-UI-012: Implement Avatar placeholder component
- [ ] TASK-UI-013: Implement PlayerArea component integrating sub-components
- [ ] TASK-UI-014: Write PlayerArea tests (3 scenarios)

**Deliverables:**
- `src/components/game/ScoreDisplay.tsx`
- `src/components/avatar/Avatar.tsx`
- `src/components/game/PlayerArea.tsx`
- Test files

**Success Criteria:**
- Player area displays hand/captured/score
- Current player highlighted
- Avatar displays
- All tests pass

---

### Phase 3: Game Board

**Objective:** Implement main game board with WebSocket integration

**Dependencies:** Phase 2

**Tasks:**
- [ ] TASK-UI-015: Implement GroundArea component
- [ ] TASK-UI-016: Implement ControlPanel with Go/Stop buttons
- [ ] TASK-UI-017: Implement TurnIndicator component
- [ ] TASK-UI-018: Implement GameStatus component
- [ ] TASK-UI-019: Implement GameBoard root component with gameStore integration
- [ ] TASK-UI-020: Write GameBoard integration tests (3 scenarios)

**Deliverables:**
- `src/components/game/GroundArea.tsx`
- `src/components/game/ControlPanel.tsx`
- `src/components/game/TurnIndicator.tsx`
- `src/components/game/GameStatus.tsx`
- `src/components/game/GameBoard.tsx`
- Test files

**Success Criteria:**
- GameBoard renders complete state
- Card clicks trigger events
- Go/Stop buttons work correctly
- WebSocket events update UI
- All tests pass

---

### Phase 4: Animation System

**Objective:** Implement Framer Motion animations

**Dependencies:** Phase 3

**Tasks:**
- [ ] TASK-UI-021: Create card animation variants (hidden, visible, selected, disabled)
- [ ] TASK-UI-022: Implement card flip animation
- [ ] TASK-UI-023: Implement matching animation
- [ ] TASK-UI-024: Implement score update animation

**Deliverables:**
- `src/animations/card-animations.ts`
- `src/animations/score-animations.ts`
- Animated components

**Success Criteria:**
- Card flip smooth (0.3s)
- Matching animations trigger
- Score updates have feedback
- 60fps maintained

---

### Phase 5: Avatar System

**Objective:** Implement avatar with emotion reactions

**Dependencies:** Phase 2

**Tasks:**
- [ ] TASK-UI-025: Implement AvatarReaction component
- [ ] TASK-UI-026: Implement emotion state transitions
- [ ] TASK-UI-027: Implement win/lose reaction logic

**Deliverables:**
- `src/components/avatar/AvatarReaction.tsx`
- `src/components/avatar/AvatarAnimations.tsx`
- Emotion state management

**Success Criteria:**
- Avatar displays
- Emotions change on events
- Win/lose reactions work

---

### Phase 6: Responsive Design

**Objective:** Implement mobile/tablet/desktop layouts

**Dependencies:** Phase 3

**Tasks:**
- [ ] TASK-UI-028: Implement mobile layout (320-767px)
- [ ] TASK-UI-029: Implement tablet layout (768-1023px)
- [ ] TASK-UI-030: Implement desktop layout (1024px+)

**Deliverables:**
- Tailwind responsive classes
- `src/styles/responsive.css`
- Responsive container components

**Success Criteria:**
- Mobile functional
- Tablet optimized
- Desktop expanded
- Touch works

---

### Phase 7: Accessibility

**Objective:** Achieve WCAG 2.1 AA compliance

**Dependencies:** Phase 6

**Tasks:**
- [ ] TASK-UI-031: Add WAI-ARIA attributes to all interactive elements
- [ ] TASK-UI-032: Implement keyboard navigation
- [ ] TASK-UI-033: Verify color contrast ratios (4.5:1)
- [ ] TASK-UI-034: Screen reader testing

**Deliverables:**
- ARIA-compliant components
- Keyboard navigation
- Contrast-validated colors
- Accessibility audit report

**Success Criteria:**
- ARIA attributes complete
- Keyboard navigation works
- Contrast >= 4.5:1
- Screen reader functional
- Axe DevTools: 0 violations

---

### Phase 8: Optimization

**Objective:** Optimize performance and bundle size

**Dependencies:** Phase 7

**Tasks:**
- [ ] TASK-UI-035: Add React.memo to expensive components
- [ ] TASK-UI-036: Optimize Framer Motion GPU usage
- [ ] TASK-UI-037: Bundle size analysis and optimization
- [ ] TASK-UI-038: Performance validation (60fps, <2s FCP)

**Deliverables:**
- Optimized components
- Bundle analysis report
- Performance metrics

**Success Criteria:**
- Bundle < 500KB
- FCP < 2s
- 60fps maintained
- No memory leaks

---

## 6. Risk Assessment

### 6.1 High Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Infrastructure gap (no React) | BLOCKING | 100% | Phase 0 addresses this directly |
| WebSocket state sync | High | Medium | Use gameStore.reconcileState() |
| Animation performance drops | Medium | Medium | GPU acceleration, React.memo |
| Accessibility violations | High | Low | Axe DevTools, continuous a11y testing |

### 6.2 Medium Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Mobile layout issues | Medium | Medium | Real device testing |
| State management complexity | Medium | Medium | Zustand selectors, careful prop design |
| Bundle size bloat | Medium | Low | Code splitting, dynamic imports |

### 6.3 Low Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Avatar assets missing | Low | Low | Use placeholders initially |
| Browser compatibility | Low | Low | Modern browsers only per SPEC |

---

## 7. Task Dependencies

```
Phase 0 (Infrastructure)
    |
    v
Phase 1 (Cards) ──────────────────────────────────────────────────────┐
    |                                                               |
    v                                                               |
Phase 2 (Player Area) ─────────────┐                                |
    |                              |                                |
    v                              |                                |
Phase 3 (Game Board) ──────────────┼─────────────┐                  |
    |                              |             |                  |
    +───────────────┐              |             |                  |
    |               |              |             |                  |
    v               v              v             v                  v
Phase 4 (Animation)  Phase 5 (Avatar)  Phase 6 (Responsive)        |
    |               |              |             |                  |
    +───────────────┴──────────────┴─────────────┘                  |
    |                                                               |
    v                                                               |
Phase 7 (Accessibility)                                             |
    |                                                               |
    v                                                               |
Phase 8 (Optimization)
```

---

## 8. Technology Stack

### 8.1 Required Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "framer-motion": "^11.0.0",
    "zustand": "^4.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

### 8.2 Existing Dependencies (Reuse)

- `typescript: ^5.6.0` (already installed)
- `vitest: 2.1.9` (already installed)
- `socket.io-client: ^4.8.1` (already installed)
- `zustand: ^4.4.0` (already installed via stores)

---

## 9. File Structure

```
src/
├── app/
│   └── game/
│       └── [roomId]/
│           └── page.tsx                 # Server Component entry point
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx               # @MX:ANCHOR (fan_in: 2+)
│   │   ├── GroundArea.tsx
│   │   ├── PlayerArea.tsx              # @MX:ANCHOR (fan_in: 3+)
│   │   ├── ControlPanel.tsx
│   │   ├── ScoreDisplay.tsx
│   │   ├── TurnIndicator.tsx
│   │   ├── GameStatus.tsx
│   │   └── cards/
│   │       ├── Card.tsx                # @MX:ANCHOR (fan_in: 5+)
│   │       ├── CardBack.tsx
│   │       ├── HandCards.tsx
│   │       └── CapturedCards.tsx
│   ├── avatar/
│   │   ├── Avatar.tsx
│   │   ├── AvatarReaction.tsx
│   │   └── AvatarAnimations.tsx
│   └── layout/
│       ├── ResponsiveLayout.tsx
│       └── MobileLayout.tsx
├── hooks/
│   ├── useGameState.ts
│   ├── useCardSelection.ts
│   ├── useAnimation.ts
│   └── useBreakpoint.ts
├── animations/
│   ├── card-animations.ts
│   ├── score-animations.ts
│   └── layout-animations.ts
├── styles/
│   ├── card.css
│   ├── game-board.css
│   └── responsive.css
└── types/
    └── ui.ts                            # UI-specific types
```

---

## 10. Next Steps

1. **Approve this execution plan** - Review and confirm approach
2. **Execute Phase 0** - Set up infrastructure (Next.js, Tailwind, Framer Motion)
3. **Begin implementation** - Start with Phase 1 (Card components)
4. **Continuous validation** - Run tests after each task
5. **Quality gates** - Verify TRUST 5 compliance at each phase

---

## 11. Handover Information

For **manager-ddd** agent:

**TAG Chain:**
- Phase 0: infrastructure-setup → infrastructure-validation
- Phase 1: card-component → card-tests → card-validation
- Phase 2: player-area → score-display → avatar-placeholder
- Phase 3: game-board → ground-area → control-panel → game-board-integration
- Phase 4: animation-variants → card-flip → matching-animation
- Phase 5: avatar-reaction → emotion-transitions
- Phase 6: responsive-layouts
- Phase 7: accessibility-audit
- Phase 8: performance-optimization

**Key Decisions:**
1. React 19 + Next.js 15 chosen for Server Components and App Router
2. Framer Motion for declarative animations
3. Tailwind CSS for utility-first styling
4. Zustand for state management (already integrated)
5. TDD methodology for all component development

**Critical Integration Points:**
- `src/lib/game/types/game.types.ts` - Card, Score, GameState types
- `src/lib/websocket/client/stores/gameStore.ts` - Game state management
- `src/lib/websocket/client/stores/socketStore.ts` - Connection state

**MX Tag Requirements:**
- Add `@MX:ANCHOR` to Card, PlayerArea, GameBoard (fan_in >= 3)
- Add `@MX:NOTE` to complex animation logic
- Add `@MX:WARN` to performance-critical areas
- Add `@MX:TODO` for incomplete features

---

*Plan created: 2026-03-04*
*Status: READY FOR APPROVAL*
*Version: 1.0.0*
