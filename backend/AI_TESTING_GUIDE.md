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
