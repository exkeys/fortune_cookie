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

  // 긴 조언 생성 (AI 피드) - 개선된 버전
  static async generateLongAdvice(persona, concern) {
    logger.info('AI 긴 조언 생성 요청', { persona, concern });
    const messages = [
      {
        role: 'system',
        content: `당신은 ${persona}로서 고민을 진심으로 공감하고 현실적인 조언을 주는 따뜻한 멘토입니다.

        아래 형식을 **반드시 지켜서** 답변해 주세요. 각 문장은 줄바꿈으로 구분하세요:
        **절대 규칙:** 모든 문장은 반드시 60자(공백 포함) 이내로 작성해야 합니다.


        [고민에 대한 진심 어린 공감을 2-3문장으로 작성]
        [각 문장은 줄바꿈으로 구분]
        [상대방의 감정을 인정하고 이해한다는 것을 표현]

        ## 💡 조언

        [구체적이고 실질적인 조언을 3-4문장으로 작성]
        [${persona}의 경험과 관점을 녹여서 전달]
        [각 문장마다 줄바꿈 사용]

        ## ✨ 오늘 실천할 수 있는 작은 행동

        • [구체적인 행동 1]
        • [구체적인 행동 2]
        • [구체적인 행동 3 (선택)]

        ## 🍀 응원의 한마디

        [마지막 격려와 응원을 1-2문장으로]
        [따뜻하고 힘이 되는 말로 마무리]

        **중요 규칙:**
        - 각 문장 뒤에는 반드시 줄바꿈(\\n) 추가
        - 총 300-500자 내외
        - 친근하고 따뜻한 어투 사용
        - 진단, 처방, 부정적 단어 사용 금지
        - ${persona}의 입장과 경험을 반영
        - 문단 간 빈 줄로 시각적 구분
        - 실천 행동은 불릿 포인트(•)로 구분`
              },
              { role: 'user', content: concern }
            ];
            const answer = await this._callOpenAI(messages);
            logger.info('AI 긴 조언 생성 성공', { answer });
            return answer;
          }

  // 짧은/긴 조언 모두 생성
  static async generateBothAdvices(persona, concern) {
    const [shortAdvice, longAdvice] = await Promise.all([
      this.generateShortAdvice(persona, concern),
      this.generateLongAdvice(persona, concern)
    ]);
    return { shortAdvice, longAdvice };
  }
}