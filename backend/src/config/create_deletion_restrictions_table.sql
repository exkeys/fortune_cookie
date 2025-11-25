-- ====================================================================
-- 포춘쿠키 서비스 전체 데이터베이스 스키마 (최종 정리본)
-- 이 파일 하나로 전체 스키마를 재생성할 수 있습니다.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. 기존 테이블 및 정책 정리
-- --------------------------------------------------------------------

-- 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS public.deletion_restrictions CASCADE;
DROP TABLE IF EXISTS public.ai_answers CASCADE;
DROP TABLE IF EXISTS public.custom_roles CASCADE;
DROP TABLE IF EXISTS public.school_periods CASCADE;
DROP TABLE IF EXISTS public.daily_usage_log CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;
DROP POLICY IF EXISTS users_own_data ON public.users;
DROP POLICY IF EXISTS users_admin_select ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Allow insert for all" ON public.users;
DROP POLICY IF EXISTS "Users own data" ON public.users;

DROP POLICY IF EXISTS ai_answers_select ON public.ai_answers;
DROP POLICY IF EXISTS ai_answers_insert ON public.ai_answers;
DROP POLICY IF EXISTS ai_answers_update ON public.ai_answers;
DROP POLICY IF EXISTS ai_answers_delete ON public.ai_answers;
DROP POLICY IF EXISTS ai_answers_own_data ON public.ai_answers;
DROP POLICY IF EXISTS "AI answers own data" ON public.ai_answers;

DROP POLICY IF EXISTS custom_roles_select ON public.custom_roles;
DROP POLICY IF EXISTS custom_roles_insert ON public.custom_roles;
DROP POLICY IF EXISTS custom_roles_update ON public.custom_roles;
DROP POLICY IF EXISTS custom_roles_delete ON public.custom_roles;
DROP POLICY IF EXISTS custom_roles_own_data ON public.custom_roles;
DROP POLICY IF EXISTS "Custom roles own data" ON public.custom_roles;

DROP POLICY IF EXISTS "Anyone can read school periods" ON public.school_periods;
DROP POLICY IF EXISTS "Only admins can insert school periods" ON public.school_periods;
DROP POLICY IF EXISTS "Only admins can update school periods" ON public.school_periods;
DROP POLICY IF EXISTS "Only admins can delete school periods" ON public.school_periods;

DROP POLICY IF EXISTS "Daily usage log own data" ON public.daily_usage_log;

DROP POLICY IF EXISTS "Only admins can access deletion restrictions" ON public.deletion_restrictions;

-- 기존 함수 삭제 (있다면)
DROP FUNCTION IF EXISTS add_usage_time_ms(bigint);
DROP FUNCTION IF EXISTS add_usage_minutes(bigint) CASCADE;
DROP FUNCTION IF EXISTS set_last_logout_now() CASCADE;
DROP FUNCTION IF EXISTS admin_get_all_users() CASCADE;
DROP FUNCTION IF EXISTS admin_update_user(uuid, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS admin_get_all_ai_answers() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_restrictions() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_school_periods_updated_at ON public.school_periods;

-- 기존 인덱스 삭제
DROP INDEX IF EXISTS public.ai_answers_unique_user_persona_concern;


-- --------------------------------------------------------------------
-- 2. 메인 테이블 생성
-- --------------------------------------------------------------------

-- 2-1. users 테이블 (사용자 정보)
CREATE TABLE public.users (
  -- 기본 정보
  id UUID PRIMARY KEY,                              -- auth.users.id와 동일 (기본값 없음!)
  email TEXT,                                       -- 이메일 (UNIQUE 제약 없음)
  nickname TEXT,                                    -- 닉네임
  school TEXT,                                      -- 학교명
  
  -- OAuth 및 상태
  oauth_provider TEXT DEFAULT 'kakao',              -- OAuth 제공자
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'deleted')),
  
  -- 관리자 권한
  is_admin BOOLEAN DEFAULT false,                   -- 관리자 여부
  
  -- 로그인 정보
  last_login_at TIMESTAMPTZ,                       -- 마지막 로그인 시간
  last_logout_at TIMESTAMPTZ,                       -- 마지막 로그아웃 시간
  
  -- 접근 기간 (학교별 설정)
  access_start_date DATE,                           -- 이용 시작일
  access_end_date DATE,                             -- 이용 종료일
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),             -- 생성일
  updated_at TIMESTAMPTZ DEFAULT NOW()              -- 수정일
);

-- auth.users와 연결
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fk_auth
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- users 인덱스
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_last_login ON public.users(last_login_at);
CREATE INDEX idx_users_school ON public.users(school);


-- 2-2. ai_answers 테이블 (AI 응답 기록)
CREATE TABLE public.ai_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- AI 대화 내용
  persona TEXT NOT NULL,                            -- 선택한 페르소나
  concern TEXT NOT NULL,                            -- 사용자 고민
  ai_response TEXT NOT NULL,                        -- AI 응답
  ai_feed TEXT,                                     -- AI 피드백 (추가)
  
  -- 메타 정보
  is_saved BOOLEAN DEFAULT false,                   -- 저장 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),             -- 생성일
  updated_at TIMESTAMPTZ                            -- 수정일 (비슷한 고민으로 새 운세 받기 시)
);

COMMENT ON COLUMN public.ai_answers.updated_at IS '레코드가 마지막으로 업데이트된 시간 (비슷한 고민으로 새 운세 받기 버튼 클릭 시만 갱신)';

-- ai_answers 인덱스
CREATE INDEX idx_ai_answers_user_id ON public.ai_answers(user_id);
CREATE INDEX idx_ai_answers_created_at ON public.ai_answers(created_at);
CREATE INDEX idx_ai_answers_updated_at ON public.ai_answers(updated_at);
CREATE INDEX idx_ai_answers_saved ON public.ai_answers(is_saved);

-- 중복 저장 방지 인덱스 제거 (비슷한 고민으로 새 운세 받기 허용)
-- 같은 역할+고민으로도 새 레코드 생성 가능하도록 UNIQUE 제약 조건 없음


-- 2-3. custom_roles 테이블 (사용자 정의 역할)
CREATE TABLE public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,                         -- 역할 이름
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_roles_user_id ON public.custom_roles(user_id);


-- 2-4. school_periods 테이블 (학교별 이용 기간 관리)
CREATE TABLE public.school_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_name VARCHAR(255) NOT NULL UNIQUE,         -- 학교명
  start_date DATE NOT NULL,                         -- 시작일
  end_date DATE NOT NULL,                           -- 종료일
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_school_periods_school_name ON public.school_periods(school_name);
CREATE INDEX idx_school_periods_dates ON public.school_periods(start_date, end_date);


-- 2-5. daily_usage_log 테이블 (일일 사용 로그)
CREATE TABLE IF NOT EXISTS public.daily_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),               -- 사용 시간
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_usage_log_user_id ON public.daily_usage_log(user_id);
CREATE INDEX idx_daily_usage_log_used_at ON public.daily_usage_log(used_at);
CREATE INDEX idx_daily_usage_log_created_at ON public.daily_usage_log(created_at);


-- 2-6. deletion_restrictions 테이블 (24시간 재가입 제한)
-- 개인정보 없이 해시값만 저장
CREATE TABLE public.deletion_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 식별자 (해시값만 저장 - 개인정보 아님)
  email_hash VARCHAR(64) NOT NULL,                  -- SHA-256 해시 (64자)
  user_agent_hash VARCHAR(64),                      -- 브라우저 핑거프린트 해시
  ip_hash VARCHAR(64),                              -- IP 해시
  
  -- 시간 관리
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,                  -- 24시간 후 만료
  
  -- 삭제 사유
  deletion_reason VARCHAR(50) DEFAULT 'user_request', -- 'user_request', 'admin_action' 등
  
  -- 중복 방지
  UNIQUE(email_hash)
);

-- 인덱스 생성
CREATE INDEX idx_deletion_restrictions_expires_at ON public.deletion_restrictions(expires_at);
CREATE INDEX idx_deletion_restrictions_email_hash ON public.deletion_restrictions(email_hash);

-- 테이블 및 컬럼 주석
COMMENT ON TABLE public.deletion_restrictions IS '24시간 재가입 제한 테이블 - 개인정보 없음, 해시값만 저장';
COMMENT ON COLUMN public.deletion_restrictions.email_hash IS '이메일 SHA-256 해시 (개인정보 아님)';
COMMENT ON COLUMN public.deletion_restrictions.expires_at IS '24시간 후 자동 삭제 기준 시점';


-- --------------------------------------------------------------------
-- 3. 트리거 함수
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- school_periods 테이블에 트리거 적용
CREATE TRIGGER update_school_periods_updated_at
  BEFORE UPDATE ON public.school_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3-2. 만료된 재가입 제한 자동 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_restrictions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.deletion_restrictions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;


-- --------------------------------------------------------------------
-- 4. RPC 함수 (Remote Procedure Call)
-- --------------------------------------------------------------------

-- 4-1. 로그아웃 시간 기록
CREATE OR REPLACE FUNCTION set_last_logout_now()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users SET last_logout_at = NOW() WHERE id = auth.uid();
  
  -- 행이 없으면 생성 (INSERT ... ON CONFLICT)
  IF NOT FOUND THEN
    INSERT INTO users (id, last_logout_at) 
    VALUES (auth.uid(), NOW())
    ON CONFLICT (id) DO UPDATE 
    SET last_logout_at = EXCLUDED.last_logout_at;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION set_last_logout_now() TO authenticated;
REVOKE EXECUTE ON FUNCTION set_last_logout_now() FROM anon;


-- 4-2. 관리자 전용: 모든 사용자 조회
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 관리자 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY SELECT * FROM public.users;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_all_users() TO authenticated;
REVOKE EXECUTE ON FUNCTION admin_get_all_users() FROM anon;


-- 4-3. 관리자 전용: 사용자 정보 수정
CREATE OR REPLACE FUNCTION admin_update_user(
  target_user_id UUID,
  new_status TEXT DEFAULT NULL,
  new_is_admin BOOLEAN DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- 관리자 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- 사용자 업데이트
  UPDATE public.users
  SET 
    status = COALESCE(new_status, status),
    is_admin = COALESCE(new_is_admin, is_admin),
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_update_user(UUID, TEXT, BOOLEAN) TO authenticated;


-- 4-4. 관리자 전용: 모든 AI 응답 조회
CREATE OR REPLACE FUNCTION admin_get_all_ai_answers()
RETURNS SETOF public.ai_answers AS $$
BEGIN
  -- 관리자 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY SELECT * FROM public.ai_answers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_all_ai_answers() TO authenticated;


-- --------------------------------------------------------------------
-- 5. RLS (Row Level Security) 정책 설정
-- --------------------------------------------------------------------

-- 5-1. users 테이블 RLS 활성화 및 정책
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 본인 데이터 조회
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = (select auth.uid()));

-- 본인 데이터 수정
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = (select auth.uid()));

-- 신규 사용자 생성 (auth.uid()와 일치하는 경우만)
CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (id = (select auth.uid()));


-- 5-2. ai_answers 테이블 RLS
ALTER TABLE public.ai_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI answers own data" ON public.ai_answers
  FOR ALL USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));


-- 5-3. custom_roles 테이블 RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom roles own data" ON public.custom_roles
  FOR ALL USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));


-- 5-4. school_periods 테이블 RLS
ALTER TABLE public.school_periods ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 가능
CREATE POLICY "Anyone can read school periods" ON public.school_periods
  FOR SELECT USING (true);

-- 관리자만 추가 가능
CREATE POLICY "Only admins can insert school periods" ON public.school_periods
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (select auth.uid()) AND users.is_admin = true
    )
  );

-- 관리자만 수정 가능
CREATE POLICY "Only admins can update school periods" ON public.school_periods
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (select auth.uid()) AND users.is_admin = true
    )
  );

-- 관리자만 삭제 가능
CREATE POLICY "Only admins can delete school periods" ON public.school_periods
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (select auth.uid()) AND users.is_admin = true
    )
  );


-- 5-5. daily_usage_log 테이블 RLS
ALTER TABLE public.daily_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily usage log own data" ON public.daily_usage_log
  FOR ALL USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));


-- 5-6. deletion_restrictions 테이블 RLS
-- 개인정보가 없으므로 RLS 정책이 필요 없을 수 있으나, 보안을 위해 관리자만 접근 가능하도록 설정
ALTER TABLE public.deletion_restrictions ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능 (서비스 레벨에서 처리 가능하므로 필요시 조정)
CREATE POLICY "Only admins can access deletion restrictions" ON public.deletion_restrictions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (select auth.uid()) AND users.is_admin = true
    )
  );


-- ====================================================================
-- 스키마 정리 완료
-- 이 파일을 실행하면 전체 데이터베이스 스키마가 설정됩니다.
-- ====================================================================
