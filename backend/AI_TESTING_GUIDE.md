# AI 프롬프트 테스트 가이드

## randomFortune 섹션 테스트

### 현재 상태
- `randomFortune` 섹션이 주석 처리되어 있음
- AI는 역할(persona)과 고민(concern)만으로 해석을 생성

### 테스트용 주석 해제 방법

**파일**: `backend/src/services/aiService.js`  
**라인**: 58-65번째 줄

```javascript
// 현재 (주석 처리됨):
// TODO: 테스트용 - randomFortune 섹션 주석 해제
// if (randomFortune) {
//   systemContent += `
// 
// 🔮 오늘의 포춘 메시지
// "${randomFortune}"
// `;
// }

// 테스트 시 (주석 해제):
if (randomFortune) {
  systemContent += `
 
 🔮 오늘의 포춘 메시지
 "${randomFortune}"
 `;
}
```

### 테스트 시나리오

1. **주석 해제 후 테스트**
   - randomFortune이 있을 때: 포춘 메시지 섹션이 프롬프트에 포함됨
   - randomFortune이 없을 때: 포춘 메시지 섹션이 프롬프트에 포함되지 않음

2. **예상 결과**
   - 포춘 메시지가 있을 때: AI가 해당 메시지를 참고하여 해석 생성
   - 포춘 메시지가 없을 때: 역할과 고민만으로 해석 생성

### 복원 명령어
테스트 완료 후 다시 주석 처리하려면:
```bash
# 주석 처리
sed -i 's/^if (randomFortune)/\/\/ if (randomFortune)/' backend/src/services/aiService.js
sed -i 's/^  systemContent +=/\/\/   systemContent +=/' backend/src/services/aiService.js
sed -i 's/^  `;$/\/\/   `;/' backend/src/services/aiService.js
sed -i 's/^}/\/\/ }/' backend/src/services/aiService.js
```

### 주의사항
- 테스트 후 반드시 주석을 다시 처리하여 원래 상태로 복원
- 서버 재시작 필요

## 짧은 조언(shortAdvice) 비활성화 내역

- 목적: 프런트엔드에서 짧은 조언을 사용하지 않아 API 토큰 소모와 불필요 로그 발생을 막기 위함
- 적용 파일/위치:
  - 파일: `backend/src/services/aiService.js`
  - 주석 처리 범위: `generateShortAdvice` 메서드 전체
  - 참고 라인: 30-43줄 원본 위치(메서드 전체가 주석 블록으로 감싸짐)

```30:43:backend/src/services/aiService.js
  /*
  static async generateShortAdvice(persona, concern) {
    ... // 전체 메서드 주석 처리됨
  }
  */
```

- 연관 로직 조정:
  - 동일 파일 `generateBothAdvices`에서 짧은 조언 호출 제거, `shortAdvice`는 빈 문자열로 반환

```107:114:backend/src/services/aiService.js
  static async generateBothAdvices(persona, concern, randomFortune = null) {
    const longAdvice = await this.generateLongAdvice(persona, concern, randomFortune);
    const shortAdvice = '';
    return { shortAdvice, longAdvice };
  }
```

- 호출 경로 영향:
  - 라우트: `POST /api/concerns/ai/both` → 컨트롤러: `ConcernController.generateBothAdvices` → 서비스: `AIService.generateBothAdvices`
  - 응답의 `shortAdvice`는 빈 문자열로 유지됩니다.