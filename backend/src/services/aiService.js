import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';

export class AIService {
  // 내부: OpenAI 호출
  static async _callOpenAI(messages) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages
        },
        {
          headers: {
            'Authorization': `Bearer ${config.openai.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI 호출 실패', error?.response?.data || error.message);
      throw new ExternalServiceError('AI 답변 생성에 실패했습니다');
    }
  }

  // 짧은 조언 생성 (포춘쿠키)
  static async generateShortAdvice(persona, concern) {
    logger.info('AI 짧은 조언 생성 요청', { persona, concern });
    const messages = [
      {
        role: 'system',
        content: `당신은 포춘쿠키 속 지혜로운 조언자입니다. ${persona}의 입장에서 한 문장으로 짧고 가볍지만 힘이 되는 조언을 해주세요.\n괴롭힘, 폭력, 상실처럼 힘든 고민에는 위로와 안전을 주는 따뜻한 말로, 일반 고민에는 용기와 희망을 주는 긍정적인 말로 답해주세요. 한국어로 50자 이내, 마지막에 🍀을 붙여주세요`
      },
      { role: 'user', content: concern }
    ];
    const answer = await this._callOpenAI(messages);
    logger.info('AI 짧은 조언 생성 성공', { answer });
    return answer;
  }

  // 긴 조언 생성 (AI 피드) - 랜덤 운세 포함 버전
  static async generateLongAdvice(persona, concern, randomFortune = null) {
    logger.info('AI 긴 조언 생성 요청', { persona, concern, randomFortune });
    
    let systemContent = `
    당신은 ${persona}입니다.
    고민을 듣고 따뜻하지만 재치 있게 해석하고 응원해주는 동반자입니다.

    아래 형식을 반드시 지켜서 답변하세요.
    각 문장은 줄바꿈으로 구분합니다.
    모든 문장은 반드시 60자(공백 포함) 이내로 작성합니다.
    `;

    // TODO: 테스트용 - randomFortune 섹션 주석 해제
    // if (randomFortune) {
    //   systemContent += `
    // 
    // 🔮 오늘의 포춘 메시지
    // "${randomFortune}"
    // `;
    // }

      systemContent += `

      ✨ 포춘 쿠키 해석
      [랜덤포춘을 재치 있고 유쾌하게 해석]
      [왜 이런 메시지가 나왔는지 설명]
      [persona와 concern에 맞게 자연스럽게 연결]

      🌱 오늘 할 수 있는 실천 3가지
      • [실천 행동 1]
      • [실천 행동 2]
      • [실천 행동 3]

      💖 마지막 응원
      [따뜻한 응원 문장 1]
      [따뜻한 응원 문장 2]

      📌 규칙
      - 각 문장 끝에 줄바꿈(\\n)을 넣을 것
      - 전체 분량은 300~450자 내외
      - 활기 있고 따뜻한 어투
      - 진단, 처방, 부정 표현 금지
      - persona와 concern의 맥락 반영
      - 문단 사이에는 줄바꿈 2개(\\n\\n)
      - 실천 행동은 • 로 구분
      `;


    const messages = [
      {
        role: 'system',
        content: systemContent
      },
      { role: 'user', content: concern }
    ];
    
    const answer = await this._callOpenAI(messages);
    logger.info('AI 긴 조언 생성 성공', { answer });
    return answer;
  }

  // 짧은/긴 조언 모두 생성
  static async generateBothAdvices(persona, concern, randomFortune = null) {
    const [shortAdvice, longAdvice] = await Promise.all([
      this.generateShortAdvice(persona, concern),
      this.generateLongAdvice(persona, concern, randomFortune)
    ]);
    return { shortAdvice, longAdvice };
  }
}