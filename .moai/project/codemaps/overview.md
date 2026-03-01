# Architecture Overview - 세이 맞고 리부트

## Project Goals

세이 맞고 리부트는 실시간 2인용 카드 게임 웹 애플리케이션으로, 다음 목표를 달성하고자 합니다:

1. **실시간 대전 경험**: WebSocket을 통한 낮은 지연시간의 1:1 매칭 및 게임 진행
2. **풍부한 사용자 경험**: 전신 아바타와 감정 표현 리액션 시스템
3. **성장 시스템**: 계급 진급과 자산 관리를 통한 장기적 참여 유도
4. **현대적 재해석**: 전통 맞고 게임의 규칙을 웹 환경에 최적화

## Design Principles

- **단순성**: 2인 전용으로 로직 단순화
- **반응성**: 실시간 상태 동기화 및 매끄러운 애니메이션
- **확장성**: 모듈화된 아키텍처로 기능 추가 용이성
- **접근성**: 모바일과 데스크톱 모두 지원

## System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Next.js Web App)                                   │
│  - Game UI                                                  │
│  - Avatar System                                           │
│  - State Management (Zustand)                              │
└─────────────┬───────────────────────────────────────────────┘
              │ WebSocket
┌─────────────▼───────────────────────────────────────────────┐
│  Game Server (WebSocket Server)                            │
│  - Matchmaking                                              │
│  - Game Logic                                              │
│  - State Synchronization                                   │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│  Database Layer                                             │
│  - PostgreSQL (Users, Stats, History)                      │
│  - Redis (Game State, Matchmaking Queue)                   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Decisions

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend | Next.js 14 + React | 서버 사이드 렌더링, 빠른 빌드 |
| State | Zustand | 가벼운 상태 관리, 간단한 API |
| Real-time | Socket.io | 양방향 이벤트, 자동 재연결 |
| Database | PostgreSQL + Redis | 안정성 + 빠른 캐싱 |
| Deployment | Vercel | 간편한 배포, 자동 확장 |

## Next Steps

상세 아키텍처 문서는 코드 작성 후 업데이트됩니다:
- modules.md: 모듈별 책임과 인터페이스
- dependencies.md: 의존성 그래프
- entry-points.md: 애플리케이션 진입점
- data-flow.md: 데이터 흐름과 상태 관리
