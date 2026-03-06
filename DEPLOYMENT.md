# Say Mat-go Reboot 배포 가이드

## 배포 아키텍처

```
┌─────────────────┐
│   Frontend      │  Vercel (정적 호스팅 + Edge Functions)
│   (Next.js 16)  │  URL: https://say-matgo.vercel.app
└─────────┬───────┘
          │
          │ WebSocket Connection
          │
┌─────────▼───────┐
│   Backend       │  Railway (WebSocket Server)
│   (Socket.IO)   │  URL: wss://say-matgo.up.railway.app
└─────────────────┘
```

## 1. Railway 백엔드 배포

### 1.1 Railway CLI 설치

```bash
npm install -g @railway/cli
```

### 1.2 Railway 로그인

```bash
railway login
```

### 1.3 프로젝트 설정

```bash
# 프로젝트 초기화
railway init

# 또는 기존 프로젝트에 연결
railway link
```

### 1.4 환경 변수 설정

Railway 대시보드에서 다음 환경 변수를 설정합니다:

**필수 변수:**
- `PORT`: 8080 (Railway 자동 설정)
- `NODE_ENV`: production
- `CLIENT_URL`: 프론트엔드 Vercel URL

**선택 변수 (Supabase 인증 시):**
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_JWKS_URL`: JWKS 엔드포인트

**선택 변수 (Redis 사용 시):**
- `REDIS_URL`: Redis 연결 URL

### 1.5 배포

```bash
# 배포 실행
railway up

# 백그라운드 배포
railway up --detach

# 배포 상태 확인
railway status

# 로그 확인
railway logs
```

### 1.6 배포 URL 확인

```bash
# 도메인 확인
railway domain

# 출력 예: wss://say-matgo-websocket.up.railway.app
```

## 2. Vercel 프론트엔드 배포

### 2.1 Vercel CLI 설치

```bash
npm install -g vercel
```

### 2.2 Vercel 로그인

```bash
vercel login
```

### 2.3 프로젝트 배포

```bash
# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 2.4 환경 변수 설정

Vercel 대시보드 또는 CLI에서 환경 변수 설정:

```bash
# WebSocket URL 설정
vercel env add NEXT_PUBLIC_WEBSOCKET_URL production

# 값 입력: wss://say-matgo-websocket.up.railway.app
```

### 2.5 배포 URL 확인

```bash
# 배포된 URL 확인
vercel ls

# 출력 예: https://say-matgo.vercel.app
```

## 3. 환경 변수 설정

### 3.1 로컬 개발 (.env.local)

```bash
# .env.local 파일 생성
cp .env.example .env.local

# WebSocket URL 설정
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:8080
```

### 3.2 Railway 환경 변수

```bash
# CLI로 설정
railway variables set PORT 8080
railway variables set NODE_ENV production
railway variables set CLIENT_URL https://say-matgo.vercel.app
```

### 3.3 Vercel 환경 변수

Vercel 대시보드 > Settings > Environment Variables:

```
NEXT_PUBLIC_WEBSOCKET_URL=wss://say-matgo-websocket.up.railway.app
```

## 4. CI/CD 자동화

GitHub Actions를 통한 자동 배포가 설정되어 있습니다:

### 4.1 Required Secrets

GitHub Repository > Settings > Secrets:

- `RAILWAY_TOKEN`: Railway API 토큰
- `VERCEL_TOKEN`: Vercel API 토큰
- `VERCEL_ORG_ID`: Vercel 조직 ID
- `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID
- `CODECOV_TOKEN`: Codecov 토큰 (선택)

### 4.2 워크플로우

`.github/workflows/deploy.yml`:

1. **Test**: 테스트 실행
2. **Deploy Frontend**: Vercel에 배포
3. **Deploy Backend**: Railway에 배포

### 4.3 자동 배포 트리거

```bash
# main 브랜치에 푸시 시 자동 배포
git add .
git commit -m "feat: new feature"
git push origin main
```

## 5. 배포 확인

### 5.1 헬스 체크

```bash
# 백엔드 헬스 체크 (구현 필요)
curl https://say-matgo-websocket.up.railway.app/health

# 프론트엔드 접속
curl https://say-matgo.vercel.app
```

### 5.2 WebSocket 연결 테스트

```javascript
// 브라우저 콘솔에서 테스트
const io = require('socket.io-client');

const socket = io('wss://say-matgo-websocket.up.railway.app', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ WebSocket 연결 성공');
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket 연결 실패:', error);
});
```

## 6. 모니터링

### 6.1 Railway 모니터링

```bash
# 실시간 로그
railway logs --follow

# 메트릭 확인
railway status
```

Railway 대시보드:
- CPU/Memory 사용량
- 네트워크 트래픽
- 요청/응답 시간

### 6.2 Vercel 모니터링

Vercel 대시보드:
- 빌드 로그
- 배포 히스토리
- 성능 메트릭
- 에러 추적

## 7. 문제 해결

### 7.1 WebSocket 연결 실패

**문제:** CORS 에러

**해결:** Railway 환경 변수 확인
```bash
railway variables set CLIENT_URL https://say-matgo.vercel.app
```

**문제:** 연결 시간초과

**해결:** Railway 헬스 체크 구현 및 포트 확인

### 7.2 배포 실패

**문제:** 빌드 실패

**해결:** 로컬에서 빌드 테스트
```bash
npm run build
npm run typecheck
npm run lint
```

**문제:** 테스트 실패

**해결:** 커버리지 확인
```bash
npm run test:coverage
```

### 7.3 환경 변수 누락

**Railway:**
```bash
railway variables list
```

**Vercel:**
```bash
vercel env pull .env.production
```

## 8. 비용 최적화

### 8.1 Railway 무료 플랜

- $5 크레딧/월
- WebSocket 서버에 충분

### 8.2 Vercel 무료 플랜

- 100GB 대역폭/월
- 개인 프로젝트에 충분

### 8.3 비용 절감 팁

1. Redis 없이 단일 인스턴스 사용
2. 불필요한 로그 감소
3. 이미지 최적화
4. 정적 자산 CDN 캐싱

## 9. 보안 체크리스트

- [ ] 환경 변수 별도 관리 (.gitignore 확인)
- [ ] CORS 설정 확인
- [ ] WebSocket 인증 구현 (JWT)
- [ ] Rate limiting 구현
- [ ] HTTPS 강제 사용
- [ ] Security headers 설정

## 10. 롤백 절차

### 10.1 Railway 롤백

```bash
# 배포 히스토리 확인
railway status

# 이전 배포로 롤백
railway rollback
```

### 10.2 Vercel 롤백

```bash
# 배포 목록 확인
vercel ls

# 특정 배포로 롤백
vercel rollback [deployment-url]
```

## 11. 추가 리소스

- [Railway 문서](https://docs.railway.app)
- [Vercel 문서](https://vercel.com/docs)
- [Socket.IO 문서](https://socket.io/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
