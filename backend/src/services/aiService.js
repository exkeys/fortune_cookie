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
          model: 'gpt-4',
          messages,
          temperature: 0.6
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

  /*
  // [비활성화됨] 짧은 조언 생성 (포춘쿠키)
  // 프런트엔드에서 짧은 조언을 사용하지 않아 주석 처리되었습니다.
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
  */

  // 긴 조언 생성 (AI 피드) - 랜덤 운세 포함 버전
  static async generateLongAdvice(persona, concern, randomFortune = null) {
    logger.info('AI 긴 조언 생성 요청', { persona, concern, randomFortune });
    
    let systemContent = `당신은 ${persona}입니다.
    고민을 듣고 따뜻하지만 재치 있게 해석하고 응원해주는 동반자입니다.

    아래 형식을 반드시 지켜서 답변하세요.
    각 문장은 줄바꿈으로 구분합니다.
    모든 문장은 반드시 60자(공백 포함) 이내로 작성합니다.
    `;

    // 랜덤 포춘이 있을 경우 프롬프트에 명확히 포함
    if (randomFortune) {
      systemContent += `

    🔮 오늘 당신에게 온 포춘 쿠키 메시지
    "${randomFortune}"

    이 메시지를 반드시 활용해서 답변하세요!
    `;
        }

        systemContent += `

    ✨ 포춘 쿠키 해석
    ${randomFortune ? `[위의 "${randomFortune}" 메시지를 재치있게 해석]` : '[포춘 쿠키 메시지를 재치있게 해석]'}
    [이 메시지가 왜 지금 필요한지, 고민과 어떻게 연결되는지 설명]
    [${persona}의 관점에서 고민(${concern})과 자연스럽게 연결]
    [2-3문장으로 구성, 각 문장은 60자 이내]

    🌱 오늘 할 수 있는 실천 3가지
    • [구체적이고 실행 가능한 행동 1 - 60자 이내]
    • [구체적이고 실행 가능한 행동 2 - 60자 이내]
    • [구체적이고 실행 가능한 행동 3 - 60자 이내]

    💖 마지막 응원
    [따뜻하고 힘이 되는 응원 문장 1 - 60자 이내]
    [긍정적인 마무리 문장 2 - 60자 이내]

    📌 중요 규칙
    - 각 문장 끝에 줄바꿈(\\n)을 넣을 것
    - 전체 분량은 300~450자 내외
    - 활기 있고 따뜻한 어투 사용
    - 진단, 처방, 부정 표현 금지
    - persona와 concern의 맥락을 반드시 반영
    - 문단 사이에는 줄바꿈 2개(\\n\\n)
    - 실천 행동은 • 로 구분
    - 의미 없는 문자 조각이나 무작위 영문 단독 토큰 출력 금지
    - 반드시 모든 답변을 한국어로만 작성할 것
    ${randomFortune ? `- "${randomFortune}" 이 메시지를 꼭 언급하고 해석에 활용할 것` : ''}

    예시 (persona: 유튜버, concern: 영상 올릴까 말까 고민, fortune: "오래된 방식을 버리세요"):

    ✨ 포춘 쿠키 해석
    "오래된 방식을 버리세요"라는 메시지가 딱 지금 필요했나봐요.
    완벽한 영상 만들려고 고민만 하는 게 바로 '오래된 방식'이에요.
    일단 올리고 피드백 받으면서 성장하는 게 진짜 유튜버의 방식이죠!

    🌱 오늘 할 수 있는 실천 3가지
    • 영상 한 번 더 확인하고 업로드 버튼 눌러보기
    • 완벽하지 않아도 괜찮다고 스스로에게 말해주기
    • 첫 댓글에 "피드백 환영해요!" 남기기

    💖 마지막 응원
    망설임을 버리고 실행으로 배우는 시간이 왔어요.
    당신의 콘텐츠를 기다리는 사람들이 분명 있을 거예요!
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
    // 짧은 조언은 비활성화되었습니다. 긴 조언만 생성합니다.
    const longAdvice = await this.generateLongAdvice(persona, concern, randomFortune);
    // const shortAdvice = ''; // [비활성화됨] 짧은 조언은 사용하지 않습니다.
    return { longAdvice };
  }
}