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

// AI 답변 생성 엔드포인트 (GPT-4 연동, userId 없이도 저장 가능)
function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

app.post('/api/concerns', async (req, res) => {
  const { persona, concern, userId } = req.body;
  if (!persona || !concern) {
    return res.status(400).json({ error: 'persona와 concern이 필요합니다.' });
  }

  try {
    const aiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: `${persona}의 입장에서 고민에 답변해줘.` },
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

    // userId가 uuid 형식이 아니면 null로 저장
    const safeUserId = isUUID(userId) ? userId : null;

    const { error: dbError } = await supabase
      .from('ai_answers')
      .insert([{
        user_id: safeUserId,
        persona,
        concern,
        ai_response: aiAnswer
      }]);
    if (dbError) {
      console.error('Supabase 저장 오류:', dbError);
      return res.status(500).json({ error: 'DB 저장 실패' });
    }

    return res.json({ answer: aiAnswer });
  } catch (err) {
    console.error('AI 생성 오류:', err?.response?.data || err.message || err);
    return res.status(500).json({ error: 'AI 답변 생성 실패' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});