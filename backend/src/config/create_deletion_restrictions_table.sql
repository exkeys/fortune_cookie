-- 24시간 재가입 제한용 테이블 (개인정보 완전 없음)
CREATE TABLE deletion_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 식별자 (개인정보 아님)
  email_hash VARCHAR(64) NOT NULL,        -- SHA-256 해시 (64자)
  user_agent_hash VARCHAR(64),            -- 브라우저 핑거프링트 해시
  ip_hash VARCHAR(64),                    -- IP 해시 (추가 보안)
  
  -- 시간 관리
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- 중복 방지
  UNIQUE(email_hash),
  
  -- 감사용 (개인정보 없는 메타데이터만)
  deletion_reason VARCHAR(50) DEFAULT 'user_request'  -- 'user_request', 'admin_action' 등
);

-- 성능 최적화 인덱스
CREATE INDEX idx_deletion_restrictions_expires_at ON deletion_restrictions(expires_at);
CREATE INDEX idx_deletion_restrictions_email_hash ON deletion_restrictions(email_hash);

-- 자동 정리를 위한 함수 (PostgreSQL)
CREATE OR REPLACE FUNCTION cleanup_expired_restrictions()
RETURNS void AS $$
BEGIN
  DELETE FROM deletion_restrictions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 주석으로 설명
COMMENT ON TABLE deletion_restrictions IS '24시간 재가입 제한 테이블 - 개인정보 없음, 해시값만 저장';
COMMENT ON COLUMN deletion_restrictions.email_hash IS '이메일 SHA-256 해시 (개인정보 아님)';
COMMENT ON COLUMN deletion_restrictions.expires_at IS '24시간 후 자동 삭제 기준 시점';
