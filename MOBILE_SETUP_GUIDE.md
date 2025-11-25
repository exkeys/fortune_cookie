# 모바일 환경 설정 가이드

## 📱 IP 주소 확인 및 설정

### 1. 현재 PC의 IP 주소 확인
Windows PowerShell에서 다음 명령어 실행:
```powershell
ipconfig
```
**IPv4 주소**를 확인하세요 (예: `192.168.x.x` 또는 `172.30.x.x`)

### 2. 모바일 접근용 IP 주소 설정
모바일 기기에서 접근할 때 사용할 IP 주소를 설정합니다.

**프론트엔드** (`frontend_change/.env`):
```bash
VITE_API_BASE_URL=http://[MOBILE_IP]:4000
VITE_OAUTH_REDIRECT_URI=http://[MOBILE_IP]:3000/oauth-callback
```

**백엔드** (`backend/src/config/index.js`):
- CORS 설정에 `http://[MOBILE_IP]:3000` 추가

### 3. 현재 프로젝트 설정 (예시)
- **모바일 접근용 주소**: `http://192.168.120.48:3000` (모바일 기기에서 접근)
- **PC 주소**: `http://172.30.1.110:3000` (PC에서 접근, 참고용)
- **백엔드 API**: `http://192.168.120.48:4000` (모바일 접근용)

> ⚠️ **주의**: 
> - 모바일 접근용 IP 주소는 PC의 네트워크 IP 주소를 사용합니다
> - PC 주소와 모바일 접근용 주소가 다를 수 있습니다 (네트워크 환경에 따라)
> - 모바일에서 접근할 때는 **모바일 접근용 주소**를 사용해야 합니다

## 1. 카카오 개발자 콘솔 설정

### Redirect URI 추가 방법

1. **카카오 개발자 콘솔 접속**
   - https://developers.kakao.com 접속
   - 내 애플리케이션 선택

2. **플랫폼 설정**
   - 좌측 메뉴: **앱 설정** > **플랫폼**
   - **Web 플랫폼** 선택
   - **사이트 도메인**에 모바일 접근용 주소 추가: `http://192.168.120.48:3000`

3. **Redirect URI 등록**
   - **앱 설정** > **플랫폼** > **Web 플랫폼** > **Redirect URI**
   - 다음 URI를 추가:
     ```
     http://192.168.120.48:3000/oauth-callback
     ```
   - PC에서도 접근하려면 PC 주소도 추가: `http://172.30.1.110:3000/oauth-callback`

4. **저장**
   - 모든 변경사항 저장

### 확인 사항
- ✅ REST API 키가 활성화되어 있는지 확인
- ✅ 카카오 로그인 활성화 상태 확인
- ✅ Redirect URI가 정확히 일치하는지 확인 (대소문자, 슬래시 포함)

---

## 2. Supabase 설정

### Redirect URL 추가 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **Authentication 설정**
   - 좌측 메뉴: **Authentication** > **URL Configuration**

3. **Redirect URLs 추가**
   - **Redirect URLs** 섹션에서 다음 URL 추가:
     ```
     http://192.168.120.48:3000/auth/callback
     ```
   - PC에서도 접근하려면 PC 주소도 추가: `http://172.30.1.110:3000/auth/callback`
   - 기존 localhost URL도 유지 (로컬 개발용)

4. **Site URL 확인**
   - **Site URL**도 확인 (필요시 수정)
   - 모바일 접근용: `http://192.168.120.48:3000`
   - PC 접근용: `http://172.30.1.110:3000` (선택사항)

5. **저장**
   - 모든 변경사항 저장

### OAuth Provider 설정 (카카오)
1. **Authentication** > **Providers** > **Kakao**
2. **Enabled** 체크
3. **Client ID**: 카카오 REST API 키 입력
4. **Client Secret**: 카카오 Client Secret 입력
5. **Redirect URL** 확인:
   ```
   https://rudiauwvjsczsfbtjfoz.supabase.co/auth/v1/callback
   ```
   (이 URL을 카카오 개발자 콘솔에도 추가해야 할 수 있음)

---

## 3. 네트워크 확인 사항

### 방화벽 설정
- Windows 방화벽에서 **3000 포트**와 **4000 포트** 허용 확인
- 방화벽 설정 방법:
  1. Windows 보안 > 방화벽 및 네트워크 보호
  2. 고급 설정
  3. 인바운드 규칙 > 새 규칙
  4. 포트 선택 > TCP > 특정 로컬 포트: `3000, 4000`
  5. 연결 허용 선택
  6. 프로필 모두 선택
  7. 이름: "Fortune Cookie Dev"

### 네트워크 확인
- 모바일 기기와 개발 PC가 **같은 Wi-Fi 네트워크**에 연결되어 있는지 확인
- 모바일에서 브라우저로 `http://192.168.120.48:3000` 접속 테스트

---

## 4. 서버 재시작

설정 변경 후 다음을 재시작하세요:

1. **프론트엔드 서버 재시작**
   ```bash
   cd frontend_change
   npm run dev
   ```

2. **백엔드 서버 재시작**
   ```bash
   cd backend
   npm start
   ```

---

## 5. 테스트 방법

1. **모바일 브라우저에서 접속**
   - `http://192.168.120.48:3000` 접속 (모바일 접근용 주소)

2. **카카오 로그인 테스트**
   - 로그인 버튼 클릭
   - 카카오 로그인 진행
   - 리다이렉트 확인

3. **에러 발생 시 확인**
   - 브라우저 콘솔 확인
   - 네트워크 탭에서 API 요청 확인
   - 백엔드 로그 확인

---

## 6. 문제 해결

### 카카오 로그인 에러
- **"redirect_uri_mismatch"**: 카카오 개발자 콘솔의 Redirect URI가 정확히 일치하는지 확인
- **"invalid_client"**: REST API 키 확인

### Supabase 에러
- **"redirect_uri_mismatch"**: Supabase 대시보드의 Redirect URL 확인
- **CORS 에러**: Supabase 대시보드에서 Site URL 확인

### 네트워크 연결 에러
- 모바일과 PC가 같은 네트워크인지 확인
- 방화벽 설정 확인
- IP 주소가 변경되지 않았는지 확인 (`ipconfig` 명령어로 확인)

---

## 참고사항

- **IP 주소 확인**: `ipconfig` 명령어로 현재 PC의 IPv4 주소 확인
- **모바일 접근용 주소**: `192.168.120.48` (모바일 기기에서 접근할 때 사용)
- **PC 주소**: `172.30.1.110` (PC에서 접근할 때 사용, 참고용)
- **IP 주소 변경 시**: 모든 설정(카카오, Supabase, 환경변수)을 다시 업데이트해야 합니다
- **프로덕션 환경**: 도메인을 사용하는 것을 권장합니다
- **HTTPS**: SSL 인증서가 필요합니다
- **네트워크 변경 시**: Wi-Fi 네트워크가 바뀌면 IP 주소도 변경될 수 있으므로 주의




