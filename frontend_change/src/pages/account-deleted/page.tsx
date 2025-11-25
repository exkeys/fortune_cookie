import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';

export default function AccountDeletedPage() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      background: "linear-gradient(to bottom right, #fde68a, #fed7aa, #fecdd3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      margin: 0,
      boxSizing: "border-box"
    }}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        background: "white",
        borderRadius: "8px",
        padding: isMobile ? "40px 24px" : "60px 40px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
        textAlign: "center"
      }}>
        <div style={{
          fontSize: "72px",
          marginBottom: "24px",
          color: "#1a73e8"
        }}>🥠</div>
        
        <h1 style={{
          fontSize: isMobile ? "28px" : "36px",
          marginBottom: "16px",
          fontWeight: 400,
          color: "#202124"
        }}>계정 삭제 완료</h1>
        
        <p style={{
          fontSize: isMobile ? "15px" : "16px",
          color: "#5f6368",
          marginBottom: "40px",
          lineHeight: 1.5
        }}>포춘쿠키 서비스를 이용해 주셔서 감사합니다.</p>
        
        <div style={{
          background: "#f8f9fa",
          borderRadius: "8px",
          padding: window.innerWidth <= 768 ? "20px" : "24px",
          marginBottom: "40px",
          textAlign: "left"
        }}>
          <div style={{
            display: "flex",
            alignItems: "start",
            marginBottom: "16px",
            color: "#202124",
            fontSize: "14px",
            lineHeight: 1.6
          }}>
            <span style={{
              color: "#1a73e8",
              fontWeight: "bold",
              marginRight: "12px",
              fontSize: "16px",
              flexShrink: 0
            }}>✓</span>
            모든 개인정보가 안전하게 삭제되었습니다
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "start",
            marginBottom: "16px",
            color: "#202124",
            fontSize: "14px",
            lineHeight: 1.6
          }}>
            <span style={{
              color: "#1a73e8",
              fontWeight: "bold",
              marginRight: "12px",
              fontSize: "16px",
              flexShrink: 0
            }}>✓</span>
            재가입은 24시간 후부터 가능합니다
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "start",
            color: "#202124",
            fontSize: "14px",
            lineHeight: 1.6
          }}>
            <span style={{
              color: "#1a73e8",
              fontWeight: "bold",
              marginRight: "12px",
              fontSize: "16px",
              flexShrink: 0
            }}>✓</span>
            문의사항은 cgraph24@gmail.com으로 보내주세요
          </div>
        </div>
        
        <button
          onClick={() => navigate('/')}
          style={{
            background: "#1a73e8",
            color: "white",
            padding: "12px 32px",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1765cc";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1a73e8";
            e.currentTarget.style.boxShadow = "none";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(1px)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          홈으로 이동
        </button>
      </div>
    </div>
  );
}

