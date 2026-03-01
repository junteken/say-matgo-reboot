# 세이 맞고 리부트 - 기술 문서

## 기술 스택 개요

### 프론트엔드
- **Next.js 14**: React 기반의 전체 스택 프레임워크
- **TypeScript**: 정적 타입 검사를 통한 코드 안정성
- **Tailwind CSS**: 유틸리티 우선의 CSS 프레임워크
- **Zustand**: 경량 상태 관리 라이브러리
- **Framer Motion**: 애니메이션 및 인터랙션 라이브러리

### 백엔드 (서버리스)
- **Next.js API Routes**: 서버리스 아키텍처
- **WebSocket**: 실시간 양방향 통신
- **Vercel**: 배포 및 호스팅 플랫폼
- **Redis**: 캐싱 및 세션 관리

### 데이터베이스
- **PostgreSQL**: 주 데이터 저장소
- **Redis**: 실시간 데이터 캐싱
- **Supabase**: 인증 및 파일 저장소

### 개발 도구
- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **Husky**: Git 훅 관리
- **Playwright**: E2E 테스팅

## 프레임워크 선택 및 이유

### 1. Next.js 14 선택 이유

**장점:**
- **App Router**: 서버 컴포넌트와 클라이언트 컴포넌트의 명확한 분리
- **서버리스 아키텍처**: Vercel 배포를 통한 확장성
- **성능 최적화**: 자동 코드 분할 및 이미지 최적화
- **TypeScript 지원**: 원활한 타입 통합

**실시간 게임 적용:**
- API Routes를 통한 WebSocket 서버 구현
- 서버 컴포넌트로 게임 상태 관리
- 클라이언트 컴포넌트로 실시간 UI 업데이트

### 2. React + TypeScript 선택 이유

**장점:**
- **가상 DOM**: 빠른 UI 렌더링
- **컴포넌트 아키텍처**: 재사용성 유지
- **TypeScript**: 정적 타입 검사로 오류 예방
- **에코시스템**: 풍부한 라이브러리 생태계

**실시간 게임 적용:**
- 상태 변화에 대한 효율적인 렌더링
- 타입 안전한 게임 상태 관리
- 컴포넌트 기반의 게임 요소 구조화

### 3. WebSocket 기술 선택

**WebSocket vs HTTP Long Polling:**
- WebSocket: 실시간 양방향 통신 (지연 최소화)
- Long Polling: 단방향 통신 (지발 발생)

**Socket.io 선택 이유:**
- 자동 재연결 메커니즘
- 방(Room) 기능으로 게임 세션 관리
- 이벤트 기반 아키텍처
- 네트워크 대기 상태 처리

## 개발 환경 요구사항

### 필수 개발 도구
```bash
# Node.js 버전 확인
node --version  # v18.18.0 이상

# npm 버전 확인
npm --version   # 9.0.0 이상

# Git 버전 확인
git --version   # 2.30.0 이상
```

### 프로젝트 초기화
```bash
# Next.js 프로젝트 생성
npx create-next-app@latest gostop --typescript --tailwind --eslint --app

# 필요한 패키지 설치
npm install socket.io zustand framer-motion @types/node

# 개발 서버 실행
npm run dev
```

### 개발 환경 구성 파일
```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "playwright test"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "18.2.0",
    "typescript": "5.2.2"
  }
}
```

## 빌드 및 배포 구성

### 1. Next.js 설정 (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 서버 액션 활성화
    serverActions: true,
  },
  images: {
    // 도메인 기반 이미지 최적화
    domains: ['localhost', 'your-domain.com'],
  },
  webpack: (config) => {
    // WebSocket 로더 추가
    config.module.rules.push({
      test: /\.socket$/,
      use: 'socket-loader',
    });
    return config;
  },
};

module.exports = nextConfig;
```

### 2. TypeScript 설정 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3. Vercel 배포 설정

**vercel.json:**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "postgresql://user:password@host:port/database",
    "REDIS_URL": "redis://localhost:6379",
    "NEXTAUTH_SECRET": "your-secret-key"
  }
}
```

**배포 프로세스:**
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 배포
vercel --prod

# 환경 변수 설정
vercel env add DATABASE_URL
```

## 실시간 게임 아키텍처

### 1. WebSocket 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client A      │    │   Client B      │    │   Client C      │
│   (Player 1)    │    │   (Player 2)    │    │   (Observer)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │ WebSocket              │ WebSocket              │ WebSocket
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │   Game Server    │   Redis Cache   │
                │   (Next.js)      │   (Session)     │
                │                  │                 │
                └─────────────────┴─────────────────┘
```

### 2. 게임 서버 구조
```typescript
// src/pages/api/socket.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    // 게임 방 참가
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      // 다른 플레이어에게 알림
      io.to(roomId).emit('player-joined', { playerId: socket.id });
    });

    // 게임 상태 업데이트
    socket.on('game-move', (move) => {
      // 게임 로직 처리
      const gameState = gameEngine.processMove(move);
      // 모든 플레이어에게 상태 전송
      io.to(roomId).emit('game-state', gameState);
    });

    // 연결 종료
    socket.on('disconnect', () => {
      // 게임에서 플레이어 제외
      io.to(roomId).emit('player-left', { playerId: socket.id });
    });
  });
}
```

### 3. 상태 관리 아키텍처
```typescript
// src/store/gameStore.ts
interface GameState {
  id: string;
  players: Player[];
  currentPlayer: string;
  status: 'waiting' | 'playing' | 'finished';
  cards: Card[];
  scores: { [playerId: string]: number };
  specialEffects: SpecialEffect[];
}

export const useGameStore = create<GameState>((set, get) => ({
  id: '',
  players: [],
  currentPlayer: '',
  status: 'waiting',
  cards: [],
  scores: {},
  specialEffects: [],

  // 게임 액션
  joinGame: (player: Player) => {
    const gameState = get();
    const newPlayers = [...gameState.players, player];
    set({ players: newPlayers });
  },

  makeMove: (move: GameMove) => {
    const gameState = get();
    const newGameState = gameEngine.applyMove(gameState, move);
    set(newGameState);
  }
}));
```

## 데이터베이스 권장 사항

### 1. PostgreSQL 스키마
```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_id UUID REFERENCES avatars(id),
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게임 세션 테이블
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게임 기록 테이블
CREATE TABLE game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id),
  winner_id UUID REFERENCES users(id),
  loser_id UUID REFERENCES users(id),
  base_money INTEGER,
  final_multiplier INTEGER,
  win_type VARCHAR(50),
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Redis 캐싱 전략
```typescript
// src/lib/redis/client.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

// 게임 세션 캐싱
export const cacheGameSession = async (sessionId: string, session: GameSession) => {
  await redisClient.setex(
    `game:${sessionId}`,
    3600, // 1小时过期
    JSON.stringify(session)
  );
};

// 게임 세션 조회
export const getGameSession = async (sessionId: string) => {
  const data = await redisClient.get(`game:${sessionId}`);
  return data ? JSON.parse(data) : null;
};
```

## 성능 최적화 전략

### 1. 프론트엔드 최적화
- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **코드 분할**: 동적 import를 통한 렌더링 최적화
- **메모이제이션**: React.memo와 useMemo 사용
- **웹팩 번들 분석**:undle-analyzer로 최적화

### 2. 백엔드 최적화
- **캐싱**: Redis를 통한 자주 사용되는 데이터 캐싱
- **데이터베이스 인덱싱**: 쿼리 성능 최적화
- **API 응답 압축**: gzip 압축 적용
- **WebSocket 풀링**: 연결 풀링으로 성능 향상

### 3. 실시간 통신 최적화
- **메시지 배치**: 여러 메시지를 한 번에 전송
- **더티 체킹**: 상태 변경 시만 전송
- **연결 관리**: 불필요한 연결 종료 방지
- **네트워크 대기 상태**: 오프라인 지원

## 보안 고려사항

### 1. 인증 및 권한
- **JWT 토큰**: 사용자 인증
- **세션 관리**: Redis를 통한 세션 저장
- **CORS 설정**: 도메인 간 요제한

### 2. 데이터 검증
- **입력 검증**: 사용자 입력 데이터 검증
- **SQL 인젝션 방어**: ORM 사용
- **XSS 방어**: 출력 이스케이프

### 3. 게임 보안
- **랜덤 시드**: 게임의 공정성 보장
- **상태 동기화**: 모든 클라이언트 간 상태 일치
- **치트 방지**: 서버 측 로직 검증

---

*문서 생성일: 2026-02-27*
*최종 업데이트: 2026-02-27*
*버전: 1.0.0*