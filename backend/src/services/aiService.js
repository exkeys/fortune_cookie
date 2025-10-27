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

  // 긴 조언 생성 (AI 피드)
  static async generateLongAdvice(persona, concern) {
    logger.info('AI 긴 조언 생성 요청', { persona, concern });
    const messages = [
      {
        role: 'system',
        content: `당신은 고민을 진심으로 공감하고, 현실적인 조언과 위로를 주는 따뜻한 멘토입니다.\n${persona}의 입장에서 힘이 되는 조언을 해주세요\n아래 3단계로 답변해 주세요:\n1. 고민에 대한 공감\n2. 구체적이고 실질적인 조언\n3. 오늘 바로 실천할 수 있는 팁\n총 3~5문장, 200~300자 이내로, 친근하고 희망적인 어투로 답변해 주세요. 진단, 처방, 부정적 단어는 사용하지 마세요. 마지막에 🍀을 붙여주세요.\n예시:\n'고민을 들어줘서 고마워요. 누구나 힘든 시기를 겪지만, 당신은 충분히 이겨낼 수 있어요. 오늘은 작은 산책이라도 해보는 건 어때요? 당신의 용기를 응원할게요! 🍀'\n${persona}의 입장에서 답변해 주세요.`
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
