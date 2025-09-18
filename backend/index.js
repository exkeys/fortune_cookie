import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Load environment variables
dotenv.config();


const app = express();

// 모든 요청/응답 및 에러를 콘솔에 찍는 미들웨어 추가
//app.use((req, res, next) => {
//  console.log(`[GLOBAL-REQ] ${req.method} ${req.url}`);
//  console.log('[GLOBAL-REQ] headers:', req.headers);
//  if (req.method !== 'GET') {
//    let bodyData = '';
//    req.on('data', chunk => { bodyData += chunk; });
//    req.on('end', () => {
//      try {
//        const parsed = JSON.parse(bodyData || '{}');
//        console.log('[GLOBAL-REQ] body:', parsed);
//      } catch {
//        console.log('[GLOBAL-REQ] body(raw):', bodyData);
//      }
//      next();
//    });
//  } else {
//    next();
 // }
//});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// 모든 에러를 콘솔에 찍는 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error('[GLOBAL-ERROR]', err);
  res.status(500).json({ error: '서버 내부 오류' });
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// UUID 검증 함수
function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// -------------------------
// 카카오 로그인 엔드포인트
// -------------------------
app.post('/api/auth/kakao', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: '카카오 accessToken 필요' });

  try {
    // 카카오 API로 사용자 정보 가져오기
    const kakaoRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoUser = kakaoRes.data;
    const email = kakaoUser.kakao_account.email;
    const nickname = kakaoUser.kakao_account.profile.nickname;

    // Supabase에 upsert (중복 email 처리)
    const { data, error } = await supabase
      .from('users')
      .upsert(
        [{ email, nickname }],
        { onConflict: 'email' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('[AUTH] Supabase user upsert error:', error);
      return res.status(500).json({ error: '유저 저장 실패' });
    }

    // userId 반환 → 프론트에서 localStorage에 저장
    return res.json({ userId: data.id, email: data.email, nickname: data.nickname });
  } catch (err) {
    console.error('[AUTH] 카카오 로그인 오류:', err?.response?.data || err.message);
    return res.status(500).json({ error: '카카오 로그인 실패' });
  }
});

// -------------------------
// AI 답변만 생성 (DB 저장 X)
// -------------------------
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
          { role: 'system', content: `당신은 포춘쿠키 속 지혜로운 조언자입니다. ${persona}의 입장에서 한 문장으로 짧고 가볍지만 힘이 되는 조언을 해주세요. 
괴롭힘, 폭력, 상실처럼 힘든 고민에는 위로와 안전을 주는 따뜻한 말로, 일반 고민에는 용기와 희망을 주는 긍정적인 말로 답해주세요. 한국어로 50자 이내, 마지막에 🍀을 붙여주세요` },
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

// -------------------------
// 저장하기: 역할+고민+AI답변을 DB에 저장
// -------------------------
app.post('/api/concerns/save', async (req, res) => {
  console.log('[DEBUG] /api/concerns/save 진입');
  console.log('[DEBUG] req.body:', req.body);
  const { persona, concern, aiAnswer, userId } = req.body;
  if (!persona || !concern || !aiAnswer) {
    console.log('[DEBUG] 필수값 누락:', { persona, concern, aiAnswer });
    return res.status(400).json({ error: 'persona, concern, aiAnswer가 필요합니다.' });
  }
  if (!userId || !isUUID(userId)) {
    console.log('[DEBUG] userId 누락 또는 잘못됨:', userId);
    return res.status(400).json({ error: '로그인 정보(userId)가 필요합니다.' });
  }
  try {
    console.log('[DEBUG] DB insert 시도:', { userId, persona, concern, aiAnswer });
    const { error: dbError } = await supabase
      .from('ai_answers')
      .insert({
        user_id: userId,
        persona,
        concern,
        ai_response: aiAnswer
      });
    if (dbError) {
      console.log('[DEBUG] DB 저장 오류:', dbError);
      if (dbError.code === '23505') {
        return res.status(409).json({ error: '이미 같은 고민이 저장되어 있습니다.' });
      }
      return res.status(500).json({ error: 'DB 저장 실패' });
    }
    console.log('[DEBUG] DB 저장 성공');
    return res.json({ success: true });
  } catch (err) {
    console.log('[DEBUG] DB 저장 예외:', err);
    return res.status(500).json({ error: 'DB 저장 실패' });
  }
});

// -------------------------
// 고민 목록 조회
// -------------------------
app.get('/api/concerns', async (req, res) => {
  let { userId } = req.query;
  let query = supabase.from('ai_answers').select('id, persona, concern, ai_response, created_at');
  if (!userId || userId === 'null' || userId === '') {
    query = query.is('user_id', null);
  } else if (isUUID(userId)) {
    query = query.eq('user_id', userId);
  } else {
    return res.status(400).json({ error: '유효한 userId가 필요합니다.' });
  }
  try {
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('고민 목록 조회 오류:', error);
      return res.status(500).json({ error: '고민 목록 조회 실패' });
    }
    return res.json({ concerns: data });
  } catch (err) {
    console.error('고민 목록 조회 오류:', err?.response?.data || err.message || err);
    return res.status(500).json({ error: '고민 목록 조회 실패' });
  }
});

// -------------------------
// 고민 삭제
// -------------------------
app.delete('/api/concerns/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'id가 필요합니다.' });

  try {
    const { error } = await supabase
      .from('ai_answers')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('고민 삭제 오류:', error);
      return res.status(500).json({ error: '고민 삭제 실패' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('고민 삭제 오류:', err?.response?.data || err.message || err);
    return res.status(500).json({ error: '고민 삭제 실패' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});