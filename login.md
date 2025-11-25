# 로그인 시스템 상세 문서

## 개요

현재 시스템은 **B 구조**를 사용하며, Supabase SDK만으로 인증을 처리합니다. 카카오 OAuth를 통해 로그인하며, JWT 토큰 기반 인증을 사용합니다.

## 로그인 구조 (B 구조)

### 핵심 원칙
- **Supabase SDK만 사용**: 모든 토큰 관리를 Supabase가 자동으로 처리
- **JWT 토큰 기반**: Authorization 헤더에 Bearer 토큰 사용
- **CSRF 토큰 제거**: B 구조에서는 CSRF 토큰이 불필요
- **자동 토큰 갱신**: Supabase SDK가 자동으로 access token을 갱신

## 로그인 플로우

### 1. 카카오 OAuth 로그인 (Supabase OAuth)

#### 플로우 다이어그램
```
사용자 클릭 → Supabase OAuth 시작 → 카카오 인증 → /auth/callback → 세션 생성 → 사용자 동기화 → 홈
```

#### 단계별 설명

1. **로그인 시작** (`useAuth.ts` - `login()`)
   - `supabase.auth.signInWithOAuth()` 호출
   - 카카오 OAuth로 리다이렉트
   - `redirectTo: /auth/callback` 설정

2. **카카오 인증**
   - 카카오 로그인 페이지에서 사용자 인증
   - 카카오가 `/auth/callback`으로 리다이렉트 (토큰 포함)

3. **콜백 처리** (`auth-callback/page.tsx`)
   - URL에서 `access_token`, `refresh_token` 추출
   - `supabase.auth.setSession()`으로 세션 설정
   - 백엔드 `/api/auth/sync-user` 호출하여 사용자 정보 동기화
   - 프로필 캐시를 localStorage에 저장
   - 홈으로 리다이렉트

4. **사용자 정보 동기화** (`authController.js` - `syncUser()`)
   - JWT 토큰 검증
   - 재가입 제한 체크 (24시간)
   - 기존 사용자: `public.users` 업데이트
   - 신규 사용자: `auth.users`와 `public.users`에 생성
   - 사용자 정보 반환

### 2. 카카오 REST API 로그인 (레거시, 현재 미사용)

#### 플로우 다이어그램
```
사용자 클릭 → 카카오 REST API → /oauth-callback → 인가 코드 → 백엔드 → accessToken → 로그인 API → 세션 생성 → 홈
```

#### 단계별 설명

1. **카카오 REST API 인증**
   - 카카오 개발자 콘솔에 등록된 redirect URI로 리다이렉트
   - 인가 코드 발급

2. **콜백 처리** (`oauth-callback/page.tsx`)
   - 인가 코드를 백엔드 `/api/auth/kakao/callback`으로 전달
   - 백엔드에서 카카오 access token 받기
   - 백엔드 `/api/auth/kakao`로 로그인 요청
   - 재가입 제한 체크 (24시간)
   - 백엔드에서 JWT 토큰 받기
   - `supabase.auth.setSession()`으로 세션 설정
   - 홈으로 리다이렉트

## 인증 방식

### 프론트엔드 인증

#### 토큰 관리 (`authSession.ts`)
- `getAccessToken()`: 현재 세션의 access token 가져오기
- `ensureAccessToken()`: access token이 없으면 자동 refresh
- `clearAccessToken()`: 토큰 정리 (B 구조에서는 불필요)

#### API 호출 (`apiClient.ts`)
- 모든 API 호출에 `Authorization: Bearer {token}` 헤더 자동 추가
- 401 에러 시 자동으로 토큰 refresh (최대 3번 재시도)
- Supabase SDK가 자동으로 토큰 관리

### 백엔드 인증

#### JWT 검증 미들웨어 (`middleware/auth.js`)
- `authenticateToken`: Authorization 헤더에서 JWT 추출 및 검증
- Supabase Service Role Key로 토큰 검증
- 검증 성공 시 `req.userId`에 사용자 ID 저장

#### 인증이 필요한 라우트
```javascript
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/delete-account', authenticateToken, AuthController.deleteAccount);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/sync-user', authenticateToken, AuthController.syncUser);
```

## 세션 관리

### Supabase 세션
- **저장 위치**: Supabase SDK가 자동으로 localStorage에 저장
- **세션 키**: `sb-{project-id}-auth-token`
- **자동 갱신**: Supabase SDK가 자동으로 access token 갱신

### 프로필 캐시
- **저장 위치**: `localStorage`
- **키 형식**: `user_profile_cache_{userId}`
- **데이터 구조**:
  ```json
  {
    "id": "user-id",
    "email": "user@example.com",
    "nickname": "사용자",
    "status": "active",
    "school": "학교명",
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00Z",
    "cachedAt": 1234567890
  }
  ```

### useAuth 훅 동작

1. **초기화** (`useAuth.ts`)
   - `supabase.auth.onAuthStateChange()` 리스너 등록
   - `supabase.auth.getSession()`으로 기존 세션 확인
   - 캐시된 프로필이 있으면 즉시 표시
   - 백그라운드에서 최신 정보로 갱신

2. **세션 처리** (`handleUserSession()`)
   - 재가입 제한 체크 (500ms 타임아웃)
   - Ban 상태 체크
   - 기본 사용자 데이터로 즉시 로그인 처리
   - 백그라운드에서 상세 정보 업데이트
   - 백그라운드에서 DB Upsert

3. **세션 이벤트**
   - `SIGNED_IN`: 세션 생성 시
   - `SIGNED_OUT`: 로그아웃 시
   - `INITIAL_SESSION`: 초기 세션 확인 시

## 재가입 제한 시스템

### 개요
- 회원탈퇴 후 **24시간 동안** 동일한 이메일로 재가입 불가
- **해시 기반으로 개인정보 보호**: 원본 데이터는 저장하지 않고 해시값만 저장

### 해시화 방식
- **이메일**: SHA-256 해시 (64자)
- **User-Agent**: SHA-256 해시 (브라우저 핑거프린트)
- **IP 주소**: SHA-256 해시
- **개인정보 보호**: 원본 데이터는 저장하지 않고 해시값만 저장
- **저장 테이블**: `deletion_restrictions` (개인정보 없음)

### 구현

#### 1. 회원탈퇴 시 (`accountService.js`)
```javascript
// 이메일, User-Agent, IP 주소를 SHA-256 해시로 변환
const emailHash = HashUtils.hashEmail(userEmail);        // SHA-256 (64자)
const userAgentHash = HashUtils.hashUserAgent(userAgent); // SHA-256 (64자)
const ipHash = HashUtils.hashIP(ipAddress);              // SHA-256 (64자)

// deletion_restrictions 테이블에 해시값만 저장 (개인정보 없음)
const restrictionData = {
  email_hash: emailHash,
  user_agent_hash: userAgentHash,
  ip_hash: ipHash,
  expires_at: HashUtils.getExpirationTime(), // 24시간 후
  deletion_reason: 'user_request'
};
```

#### 2. 로그인 시 체크 (`accountService.js` - `checkDeletionRestriction()`)
- 이메일을 SHA-256 해시로 변환
- 해시값으로 `deletion_restrictions` 테이블 조회
- 만료 시간 확인
- 만료되지 않았으면 재가입 제한

#### 3. 체크 위치
- `kakaoAuthService.js`: 카카오 로그인 시
- `authController.js`: `syncUser()` - Supabase OAuth 로그인 시
- `authController.js`: `validateLogin()` - 로그인 검증 API
- `useAuth.ts`: 프론트엔드 세션 처리 시

#### 4. 제한 시 처리
- 로그인 차단
- `/account-cooldown` 페이지로 리다이렉트
- Supabase 세션 삭제

## 사용자 상태 관리

### 사용자 상태 종류
- `active`: 정상 사용자
- `banned`: 차단된 사용자
- `deleted`: 탈퇴한 사용자

### 상태별 처리

#### Banned 사용자
- 로그인 시도 시 즉시 차단
- `/account-banned` 페이지로 리다이렉트
- Supabase 세션 삭제

#### Deleted 사용자
- 로그인 시도 시 차단
- "탈퇴한 계정입니다" 메시지 표시

## 로그아웃

### 플로우 (`useAuth.ts` - `logout()`)

1. **백엔드 로그아웃 API 호출**
   - `/api/auth/logout` 호출
   - 리프레시 토큰 쿠키 삭제
   - CSRF 토큰 쿠키 삭제

2. **프론트엔드 정리**
   - Supabase 세션 삭제 (`supabase.auth.signOut()`)
   - 프로필 캐시 삭제
   - localStorage 정리
   - 카카오 쿠키 삭제

3. **홈으로 리다이렉트**

## 회원탈퇴

### 플로우 (`useAuth.ts` - `deleteAccount()`)

1. **백엔드 탈퇴 API 호출** (`accountService.js` - `deleteAccount()`)
   - 재가입 제한 정보 저장 (24시간)
     - 이메일, User-Agent, IP 주소를 SHA-256 해시로 변환
     - `deletion_restrictions` 테이블에 해시값만 저장 (개인정보 없음)
   - 관련 데이터 삭제:
     - `ai_answers` 테이블
     - `daily_usage_log` 테이블 (즉시 삭제)
   - `users` 테이블에서 완전 삭제
   - Supabase Auth에서 사용자 삭제

2. **프론트엔드 정리**
   - Supabase 세션 삭제
   - 모든 사용자 데이터 삭제
   - 프로필 캐시 삭제

3. **탈퇴 완료 페이지로 리다이렉트** (`/account-deleted`)

## 주요 API 엔드포인트

### 공개 API (인증 불필요)

#### `POST /api/auth/kakao/callback`
- 카카오 인가 코드로 access token 받기
- **요청**:
  ```json
  {
    "code": "인가코드",
    "redirectUri": "리다이렉트URI"
  }
  ```
- **응답**:
  ```json
  {
    "accessToken": "카카오액세스토큰"
  }
  ```

#### `POST /api/auth/kakao`
- 카카오 로그인 (REST API 방식)
- **요청**:
  ```json
  {
    "accessToken": "카카오액세스토큰"
  }
  ```
- **응답**:
  ```json
  {
    "userId": "사용자ID",
    "email": "이메일",
    "nickname": "닉네임",
    "status": "active",
    "school": "학교명"
  }
  ```

#### `POST /api/auth/validate-login`
- 로그인 검증 (재가입 제한 체크)
- **요청**:
  ```json
  {
    "email": "이메일"
  }
  ```
- **응답**:
  ```json
  {
    "success": true,
    "canLogin": true
  }
  ```
- **제한된 경우**:
  ```json
  {
    "success": false,
    "error": "탈퇴 후 24시간 내에는 재가입할 수 없습니다.",
    "canLogin": false,
    "isRestricted": true
  }
  ```

### 인증 필요 API

#### `POST /api/auth/sync-user`
- 사용자 정보 동기화 (Supabase OAuth 로그인 후)
- **인증**: JWT 토큰 (Authorization 헤더)
- **요청**:
  ```json
  {
    "email": "이메일",
    "nickname": "닉네임"
  }
  ```
- **응답**:
  ```json
  {
    "userId": "사용자ID",
    "email": "이메일",
    "nickname": "닉네임",
    "status": "active",
    "school": "학교명",
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
  ```

#### `POST /api/auth/logout`
- 로그아웃
- **인증**: JWT 토큰
- **응답**:
  ```json
  {
    "success": true,
    "message": "로그아웃되었습니다"
  }
  ```

#### `POST /api/auth/delete-account`
- 회원탈퇴
- **인증**: JWT 토큰
- **응답**:
  ```json
  {
    "success": true,
    "message": "회원탈퇴가 완료되었습니다...",
    "data": {
      "userId": "사용자ID",
      "deleteTime": "2024-01-01T00:00:00Z",
      "restrictionExpiresAt": "2024-01-02T00:00:00Z",
      "personalDataDeleted": true
    }
  }
  ```

#### `GET /api/auth/profile`
- 사용자 프로필 조회
- **인증**: JWT 토큰
- **응답**:
  ```json
  {
    "user": {
      "id": "사용자ID",
      "email": "이메일",
      "nickname": "닉네임",
      "status": "active",
      "school": "학교명",
      "is_admin": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
  ```

## 주요 파일 구조

### 프론트엔드

#### `frontend_change/src/hooks/useAuth.ts`
- 인증 상태 관리 훅
- Supabase 세션 관리
- 로그인/로그아웃/회원탈퇴 함수

#### `frontend_change/src/pages/auth-callback/page.tsx`
- Supabase OAuth 콜백 처리
- 세션 설정 및 사용자 동기화

#### `frontend_change/src/pages/oauth-callback/page.tsx`
- 카카오 REST API 콜백 처리 (레거시)

#### `frontend_change/src/utils/authSession.ts`
- Access token 관리 유틸리티

#### `frontend_change/src/utils/apiClient.ts`
- API 호출 유틸리티
- 자동 토큰 추가 및 refresh

### 백엔드

#### `backend/src/controllers/authController.js`
- 인증 관련 컨트롤러
- 카카오 로그인, 세션 관리, 사용자 동기화

#### `backend/src/routes/authRoutes.js`
- 인증 관련 라우트 정의

#### `backend/src/services/auth/kakaoAuthService.js`
- 카카오 OAuth 서비스
- 카카오 API 호출 및 사용자 정보 조회

#### `backend/src/services/auth/accountService.js`
- 계정 관리 서비스
- 재가입 제한 체크, 회원탈퇴

#### `backend/src/middleware/auth.js`
- JWT 토큰 검증 미들웨어

#### `backend/src/utils/authTokens.js`
- 리프레시 토큰 쿠키 관리

## 보안 고려사항

### 토큰 보안
- Access token: 메모리/세션에만 저장 (localStorage에 직접 저장하지 않음)
- Refresh token: HttpOnly 쿠키에 저장 (XSS 공격 방지)
- JWT 토큰: Supabase가 자동으로 서명 및 검증

### 재가입 제한
- **해시 기반 개인정보 보호**: SHA-256 해시 사용 (64자)
- **원본 데이터 미저장**: 이메일, User-Agent, IP 주소의 원본은 저장하지 않고 해시값만 저장
- **24시간 제한**: 탈퇴 후 24시간 동안 재가입 불가 (남용 방지)
- **자동 만료**: 스케줄러가 자동으로 만료된 해시 정보 삭제

### 사용자 상태 체크
- 로그인 시마다 사용자 상태 확인 (banned, deleted)
- 밴된 사용자 즉시 차단

## 환경 변수

### 프론트엔드
- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key
- `VITE_OAUTH_REDIRECT_URI`: OAuth 리다이렉트 URI (선택)

### 백엔드
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_KEY`: Supabase Service Role Key
- `KAKAO_REST_API_KEY`: 카카오 REST API 키
- `KAKAO_CLIENT_SECRET`: 카카오 클라이언트 시크릿 (선택)
- `COOKIE_DOMAIN`: 쿠키 도메인 (선택)

## 트러블슈팅

### 로그인 실패
1. Supabase 환경 변수 확인
2. 카카오 개발자 콘솔에서 Redirect URI 확인
3. 브라우저 콘솔에서 에러 확인
4. 네트워크 탭에서 API 호출 확인

### 세션 유지 실패
1. Supabase 세션 확인 (`supabase.auth.getSession()`)
2. 토큰 만료 시간 확인
3. 자동 refresh 동작 확인

### 재가입 제한 오류
1. `deletion_restrictions` 테이블 확인
2. 해시 값 확인 (SHA-256, 64자)
3. 만료 시간 확인 (`expires_at` 필드)
4. 해시 생성 로직 확인 (`HashUtils.hashEmail()`)

## 참고사항

- 현재 시스템은 **B 구조**를 사용하며, Supabase SDK만으로 인증을 처리합니다
- CSRF 토큰은 사용하지 않습니다 (JWT만 사용)
- 모든 토큰 관리는 Supabase SDK가 자동으로 처리합니다
- 재가입 제한은 24시간이며, SHA-256 해시 기반으로 개인정보를 보호합니다
  - 이메일, User-Agent, IP 주소를 SHA-256 해시로 변환하여 저장
  - 원본 데이터는 저장하지 않고 해시값만 저장

