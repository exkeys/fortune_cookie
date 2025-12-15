import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';
import { generateLongAdvicePrompt } from '../config/prompts.js';

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
          },
          timeout: 20000  //추가: 20초 타임아웃
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      // ⚡ 타임아웃 에러 별도 처리
      if (error.code === 'ECONNABORTED') {
        logger.error('OpenAI 타임아웃 (20초 초과)');
        throw new ExternalServiceError('응답 시간이 초과되었습니다. 다시 시도해주세요.');
      }
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
    
    // 프롬프트는 별도 파일에서 관리
    const systemContent = generateLongAdvicePrompt(persona, concern, randomFortune);

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