# Say Mat-go Reboot 배포 시나리오

## 배포 개요

**프로젝트:** Say Mat-go Reboot (세이 맞고 리부트)
**아키텍처:** 프론트엔드(Vercel) + 백엔드(Railway WebSocket)
**상태:** 배포 준비 완료

---

## 1. 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 브라우저                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────────┐
│  Vercel (프론트엔드)                                        │
│  - Next.js 16 + React 19                                    │
│  - 정적 호스팅 + Edge Functions                             │
│  - URL: https://say-matgo.vercel.app                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ WebSocket (wss://)
                     │
┌────────────────────▼────────────────────────────────────────┐
│  Railway (백엔드 WebSocket 서버)                            │
│  - Socket.IO + Node.js 18                                   │
│  - Docker 컨테이너                                          │
│  - URL: wss://say-matgo-ws.up.railway.app                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 필수 배포 구성 요소

### ✅ 완료된 항목

- [x] **Dockerfile**: Railway 배포용 다중 스테이지 Dockerfile
- [x] **railway.toml**: Railway 서비스 구성
- [x] **vercel.json**: Vercel 빌드 및 배포 설정
- [x] **.env.example**: 환경 변수 템플릿
- [x] **GitHub Actions**: CI/CD 파이프라인
- [x] **package.json**: 빌드 및 시작 스크립트

---

## 3. Railway 백엔드 배포 절차

### 3.1 사전 준비

```bash
# 1. Railway CLI 설치
npm install -g @railway/cli

# 2. Railway 로그인
railway login
# 브라우저에서 Railway 계정으로 로그인
```

### 3.2 프로젝트 설정

```bash
# 프로젝트 루트로 이동
cd /home/ubuntu/src/gostop

# Railway 프로젝트 초기화
railway init

# 또는 기존 프로젝트에 연결
railway link
```

### 3.3 환경 변수 설정

Railway 대시보드 또는 CLI에서 환경 변수 설정:

```bash
# 필수 환경 변수
railway variables set PORT 8080
railway variables set NODE_ENV production

# 프론트엔드 URL (CORS용)
railway variables set CLIENT_URL https://say-matgo.vercel.app

# 선택 사항: Supabase 인증 (필요 시)
railway variables set SUPABASE_URL "your-supabase-url"
railway variables set SUPABASE_ANON_KEY "your-anon-key"
railway variables set SUPABASE_JWKS_URL "your-jwks-url"

# 선택 사항: Redis (스케일링 필요 시)
railway variables set REDIS_URL "redis://..."
```

### 3.4 배포 실행

```bash
# 배포 (로그 표시)
railway up

# 백그라운드 배포
railway up --detach

# 배포 상태 확인
railway status
```

### 3.5 배포 URL 확인

```bash
# Railway 도메인 확인
railway domain

# 예상 출력:
# wss://say-matgo-ws.up.railway.app
```

### 3.6 헬스 체크

```bash
# WebSocket 서버 상태 확인
curl https://say-matgo-ws.up.railway.app

# 또는 Railway 대시보드에서 로그 확인
railway logs --follow
```

---

## 4. Vercel 프론트엔드 배포 절차

### 4.1 사전 준비

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. Vercel 로그인
vercel login
# 브라우저에서 Vercel 계정으로 로그인
```

### 4.2 프로젝트 연결

```bash
# 프로젝트 루트로 이동
cd /home/ubuntu/src/gostop

# Vercel 프로젝트 초기화
vercel

# 프롬프트 따르기:
# - Set up and deploy: Y
# - Which scope: 선택 또는 생성
# - Link to existing project: N (새 프로젝트)
# - Project name: say-matgo-reboot
# - Override settings: N (기본값 사용)
```

### 4.3 환경 변수 설정

```bash
# WebSocket URL 설정
vercel env add NEXT_PUBLIC_WEBSOCKET_URL production

# 값 입력:
# wss://say-matgo-ws.up.railway.app

# 다른 환경에도 설정 (선택)
vercel env add NEXT_PUBLIC_WEBSOCKET_URL preview
vercel env add NEXT_PUBLIC_WEBSOCKET_URL development
```

### 4.4 프로덕션 배포

```bash
# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 4.5 배포 URL 확인

```bash
# 배포 목록 확인
vercel ls

# 예상 출력:
# Production:  https://say-matgo.vercel.app
```

---

## 5. GitHub Secrets 설정 (CI/CD)

GitHub Repository > Settings > Secrets and variables > Actions:

### Required Secrets

```
RAILWAY_TOKEN=railway_xxxxx
VERCEL_TOKEN=xxxxx
VERCEL_ORG_ID=team_xxxxx
VERCEL_PROJECT_ID=prj_xxxxx
CODECOV_TOKEN=xxxxx (선택)
```

### 토큰 획득 방법

**Railway Token:**
```bash
railway token
```

**Vercel Token:**
- Vercel 대시보드 > Settings > Tokens
- 새 토큰 생성

**Vercel Org/Project IDs:**
```bash
vercel link
cat .vercel/project.json
```

---

## 6. 자동 배포 테스트

### 6.1 CI/CD 파이프라인 테스트

```bash
# main 브랜치에 변경 푸시
git checkout main
git add .
git commit -m "test: deploy production"
git push origin main

# GitHub Actions에서 자동 실행:
# 1. Test (테스트 실행)
# 2. Deploy Frontend (Vercel)
# 3. Deploy Backend (Railway)
```

### 6.2 배포 확인

**Vercel:**
```bash
# Vercel 대시보드 방문
# 또는 CLI로 확인
vercel ls
```

**Railway:**
```bash
# Railway 대시보드 방문
# 또는 CLI로 확인
railway status
```

---

## 7. 연동 테스트

### 7.1 프론트엔드-백엔드 연결 확인

```javascript
// 브라우저 개발자 콘솔에서 실행

const WebSocketUrl = 'wss://say-matgo-ws.up.railway.app';
const socket = io(WebSocketUrl, {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ WebSocket 연결 성공!');
  console.log('Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket 연결 실패:', error);
});

socket.on('disconnect', (reason) => {
  console.log('연결 해제:', reason);
});
```

### 7.2 애플리케이션 접속

```
1. 브라우저에서 프론트엔드 URL 접속:
   https://say-matgo.vercel.app

2. 네트워크 탭에서 WebSocket 연결 확인:
   - wss://say-matgo-ws.up.railway.app
   - Status: 101 Switching Protocols

3. 콘솔에서 연결 로그 확인:
   - Socket.IO 연결 성공 메시지
```

---

## 8. 배포 완료 후 체크리스트

### Railway (백엔드)

- [ ] WebSocket 서버 정상 실행
- [ ] 헬스 체크 엔드포인트 응답
- [ ] 환경 변수 모두 설정
- [ ] 로그에 에러 없음
- [ ] Redis 연결 (사용 시)

### Vercel (프론트엔드)

- [ ] 사이트 정상 접속
- [ ] WebSocket 환경 변수 설정
- [ ] 정적 자원 로딩
- [ ] 라우팅 정상 작동
- [ ] 빌드 에러 없음

### 연동 테스트

- [ ] WebSocket 연결 성공
- [ ] CORS 설정 정상
- [ ] 실시간 통신 작동
- [ ] 인증 흐름 정상 (구현 시)
- [ ] 멀티플레이어 기능 작동

---

## 9. 문제 해결 가이드

### Railway 배포 실패

**문제:** 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build
npm run build:ws
```

**문제:** WebSocket 연결 거부
```bash
# 환경 변수 확인
railway variables list

# 포트 확인
railway logs | grep PORT
```

**문제:** CORS 에러
```bash
# CLIENT_URL 확인
railway variables get CLIENT_URL
```

### Vercel 배포 실패

**문제:** 빌드 에러
```bash
# 로컬 빌드 테스트
npm run build
npm run lint
npm run typecheck
```

**문제:** 환경 변수 누락
```bash
# 환경 변수 확인
vercel env ls
```

**문제:** WebSocket 연결 실패
```bash
# NEXT_PUBLIC_WEBSOCKET_URL 확인
vercel env pull .env.production
cat .env.production
```

---

## 10. 배포 URL 정보

### 예상 배포 URL

**프론트엔드 (Vercel):**
```
https://say-matgo.vercel.app
또는
https://say-matgo-reboot.vercel.app
```

**백엔드 (Railway):**
```
wss://say-matgo-ws.up.railway.app
또는
wss://say-matgo-websocket.up.railway.app
```

### 로컬 개발 URL

**프론트엔드:**
```
http://localhost:3000
```

**백엔드:**
```
http://localhost:8080
ws://localhost:8080
```

---

## 11. 모니터링 및 관리

### Railway 모니터링

```bash
# 실시간 로그
railway logs --follow

# 서비스 상태
railway status

# 리소스 사용량
railway metrics
```

### Vercel 모니터링

- Vercel 대시보드: 배포 히스토리
- Analytics: 트래픽 및 성능
- Logs: 에러 추적

---

## 12. 롤백 절차

### Railway 롤백

```bash
# 이전 배포로 롤백
railway rollback

# 또는 Railway 대시보드에서
# Deployments > 이전 버전 선택 > Redeploy
```

### Vercel 롤백

```bash
# 배포 목록 확인
vercel ls

# 특정 배포로 롤백
vercel rollback [deployment-url]

# 또는 Vercel 대시보드에서
# Deployments > 이전 버전 선택 > Promote to Production
```

---

## 13. 비용 정보

### Railway 무료 플랜
- $5 크레딧/월
- WebSocket 서버 운영에 충분

### Vercel 무료 플랜
- 100GB 대역폭/월
- 개인 프로젝트에 충분

### 예상 월 비용
- Railway: $0-5 (트래픽에 따라)
- Vercel: $0-10 (트래픽에 따라)

---

## 14. 보안 체크리스트

- [x] 환경 변수 별도 관리 (.gitignore)
- [x] CORS 설정 구현
- [ ] JWT 인증 구현 (Supabase 연동 시)
- [ ] Rate limiting 구현
- [x] HTTPS 강제 사용 (Railway/Vercel 자동)
- [x] Security headers 설정 (vercel.json)

---

## 15. 다음 단계

1. **Railway 백엔드 배포:** 위 절차 따라 Railway에 배포
2. **Vercel 프론트엔드 배포:** 위 절차 따라 Vercel에 배포
3. **GitHub Secrets 설정:** CI/CD를 위한 토큰 설정
4. **연동 테스트:** WebSocket 연결 확인
5. **사용자 테스트:** 실제 사용 환경에서 테스트

---

**생성일:** 2026-03-06
**버전:** 1.0.0
**상태:** 배포 준비 완료 ✅
