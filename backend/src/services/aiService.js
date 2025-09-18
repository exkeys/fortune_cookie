import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';

export class AIService {
  static async generateAnswer(persona, concern) {
    try {
      logger.info('AI 답변 생성 요청', { persona, concern });
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `당신은 포춘쿠키 속 지혜로운 조언자입니다. ${persona}의 입장에서 한 문장으로 짧고 가볍지만 힘이 되는 조언을 해주세요. 
괴롭힘, 폭력, 상실처럼 힘든 고민에는 위로와 안전을 주는 따뜻한 말로, 일반 고민에는 용기와 희망을 주는 긍정적인 말로 답해주세요. 한국어로 50자 이내, 마지막에 🍀을 붙여주세요` 
            },
            { role: 'user', content: concern }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${config.openai.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const aiAnswer = response.data.choices[0].message.content;
      logger.info('AI 답변 생성 성공', { answer: aiAnswer });
      
      return { answer: aiAnswer };
    } catch (error) {
      logger.error('AI 답변 생성 실패', error?.response?.data || error.message);
      throw new ExternalServiceError('AI 답변 생성에 실패했습니다');
    }
  }
}
