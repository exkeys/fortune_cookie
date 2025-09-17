import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// UUID 검증 함수
function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}


// AI 답변만 생성 (DB 저장 X)
app.post('/api/concerns/ai', async (req, res) => {
  const { persona, concern } = req.body;
  if (!persona || !concern) {
    return res.status(400).json({ error: 'persona와 concern이 필요합니다.' });
  }
  try {
    const aiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `당신은 포춘쿠키 속 지혜로운 조언자입니다. ${persona}의 입장에서 한 문장으로 간결하고 희망적인 조언을 해주세요. 한국어로 50자 이내, 긍정적인 메시지로 마무리에 🍀을 넣어주세요.` },
          { role: 'user', content: concern }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const aiAnswer = aiRes.data.choices[0].message.content;
    return res.json({ answer: aiAnswer });
  } catch (err) {
    console.error('AI 생성 오류:', err?.response?.data || err.message || err);
    return res.status(500).json({ error: 'AI 답변 생성 실패' });
  }
});

// 저장하기: 역할+고민+AI답변을 DB에 저장
app.post('/api/concerns/save', async (req, res) => {
  const { persona, concern, aiAnswer, userId } = req.body;
  if (!persona || !concern || !aiAnswer) {
    return res.status(400).json({ error: 'persona, concern, aiAnswer가 필요합니다.' });
  }
  try {
    const safeUserId = (userId && isUUID(userId)) ? userId : null;
    const { error: dbError } = await supabase
      .from('ai_answers')
      .insert({
        user_id: safeUserId,
        persona,
        concern,
        ai_response: aiAnswer
      });
    if (dbError) {
      console.error('Supabase 저장 오류:', dbError);
      return res.status(500).json({ error: 'DB 저장 실패' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('DB 저장 오류:', err?.response?.data || err.message || err);
    return res.status(500).json({ error: 'DB 저장 실패' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});