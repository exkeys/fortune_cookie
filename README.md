# 🍪 Fortune Cookie AI - 엔터프라이즈급 웹 애플리케이션

> 구글/넷플릭스 수준의 유지보수 가능한 AI 기반 포춘쿠키 웹 애플리케이션

## 🚀 개요

Fortune Cookie AI는 사용자의 역할과 고민을 입력받아 AI가 맞춤형 조언을 제공하는 웹 애플리케이션입니다. 엔터프라이즈급 아키텍처와 모니터링 시스템을 통해 높은 가용성과 유지보수성을 보장합니다.

## ✨ 주요 기능

- 🤖 **AI 기반 맞춤형 조언**: OpenAI GPT-4o-mini를 활용한 개인화된 포춘쿠키
- 🔐 **안전한 인증**: Supabase Auth를 통한 카카오 로그인
- 📱 **반응형 디자인**: 모든 디바이스에서 최적화된 사용자 경험
- 🎨 **인터랙티브 애니메이션**: 부드러운 포춘쿠키 깨기 애니메이션
- 📊 **성능 모니터링**: 실시간 성능 및 에러 추적
- 🔒 **엔터프라이즈 보안**: CSP, XSS 보호, Rate Limiting

## 🏗️ 아키텍처

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common/         # 공통 컴포넌트 (Button, Input, etc.)
│   │   └── __tests__/      # 컴포넌트 테스트
│   ├── hooks/              # 커스텀 훅
│   ├── utils/              # 유틸리티 함수
│   │   ├── errorHandler.js # 에러 모니터링
│   │   ├── performance.js  # 성능 모니터링
│   │   └── security.js     # 보안 관리
│   ├── styles/             # 스타일 시스템
│   └── constants/          # 상수 정의
├── tests/                  # 테스트 파일
└── docs/                   # 문서
```

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── controllers/        # 요청 처리
│   ├── services/          # 비즈니스 로직
│   ├── middleware/        # 미들웨어
│   ├── routes/            # API 라우트
│   ├── utils/             # 유틸리티
│   └── config/            # 설정
└── tests/                 # 테스트 파일
```

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Styled Components** - CSS-in-JS
- **Jest + Testing Library** - 테스트
- **ESLint + Prettier** - 코드 품질

### Backend
- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **Supabase** - 데이터베이스 & 인증
- **OpenAI API** - AI 서비스

### DevOps
- **GitHub Actions** - CI/CD
- **Docker** - 컨테이너화
- **ESLint** - 코드 품질
- **Husky** - Git 훅

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.x 이상
- npm 8.x 이상
- Supabase 계정
- OpenAI API 키

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/your-username/fortune-cookie-ai.git
cd fortune-cookie-ai
```

2. **환경 변수 설정**
```bash
# frontend/.env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
```

3. **의존성 설치**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

4. **개발 서버 실행**
```bash
# Frontend (포트 3000)
cd frontend
npm run dev

# Backend (포트 4000)
cd backend
npm run dev
```

## 🧪 테스트

### 테스트 실행
```bash
# 모든 테스트
npm test

# 커버리지 포함
npm run test:coverage

# 감시 모드
npm run test:watch
```

### 테스트 커버리지 목표
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## 🔧 개발 도구

### 코드 품질
```bash
# 린팅
npm run lint

# 포맷팅
npm run format

# 타입 체크
npm run type-check
```

### 성능 분석
```bash
# 번들 분석
npm run analyze
```

## 📊 모니터링

### 에러 모니터링
- 자동 에러 캐치 및 보고
- 사용자 친화적 에러 메시지
- 에러 통계 및 분석

### 성능 모니터링
- Core Web Vitals 추적
- 사용자 상호작용 모니터링
- 메모리 사용량 추적

### 보안 모니터링
- CSP 위반 감지
- 의심스러운 활동 탐지
- Rate Limiting

## 🚀 배포

### Docker 배포
```bash
# 이미지 빌드
docker build -t fortune-cookie-frontend ./frontend
docker build -t fortune-cookie-backend ./backend

# 컨테이너 실행
docker run -p 3000:3000 fortune-cookie-frontend
docker run -p 4000:4000 fortune-cookie-backend
```

### CI/CD 파이프라인
- 자동 테스트 실행
- 코드 품질 검사
- 보안 감사
- 자동 배포

## 📈 성능 최적화

### Frontend 최적화
- 코드 분할 (Code Splitting)
- 이미지 최적화
- 번들 크기 최적화
- 캐싱 전략

### Backend 최적화
- 데이터베이스 쿼리 최적화
- API 응답 캐싱
- 연결 풀링
- 로드 밸런싱

## 🔒 보안

### 구현된 보안 기능
- Content Security Policy (CSP)
- XSS 보호
- CSRF 보호
- Rate Limiting
- 입력 데이터 검증
- 의심스러운 활동 탐지

## 📚 API 문서

### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/user` - 사용자 정보

### 고민 API
- `POST /api/concerns` - 고민 저장
- `GET /api/concerns` - 고민 목록
- `DELETE /api/concerns/:id` - 고민 삭제

### AI API
- `POST /api/ai/answer` - AI 답변 생성

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 다음을 통해 연락해 주세요:

- 이슈 생성: [GitHub Issues](https://github.com/your-username/fortune-cookie-ai/issues)
- 이메일: support@fortune-cookie-ai.com

## 🙏 감사의 말

- OpenAI - AI 서비스 제공
- Supabase - 백엔드 서비스 제공
- React 팀 - 훌륭한 UI 라이브러리 제공

---

**Made with ❤️ by Fortune Cookie AI Team**
