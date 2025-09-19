import React from 'react';
import Button from './common/Button';
import { shareToKakaoWithTemplate } from '../utils/kakao';

const ShareModal = ({ isOpen, onClose, shareData }) => {
  if (!isOpen) return null;

  const { role, concern, answer } = shareData || {};

  // 예쁘게 꾸민 공유 텍스트
  const createShareText = (platform) => {
    const baseText = `🍀 포춘 쿠키 AI 답변 🍀

📝 역할: ${role}
💭 고민: ${concern}

✨ AI 답변:
"${answer}"

#포춘쿠키 #AI #고민상담 #조언`;

    switch (platform) {
      case 'kakao':
        return `🍀 포춘 쿠키 AI 답변 🍀

📝 역할: ${role}
💭 고민: ${concern}

✨ AI 답변:
"${answer}"

#포춘쿠키 #AI #고민상담`;
      
      case 'instagram':
        return `🍀 포춘 쿠키 AI 답변 🍀

📝 역할: ${role}
💭 고민: ${concern}

✨ AI 답변:
"${answer}"

#포춘쿠키 #AI #고민상담 #조언 #인생 #멘토링`;
      
      case 'facebook':
        return `🍀 포춘 쿠키 AI 답변 🍀

📝 역할: ${role}
💭 고민: ${concern}

✨ AI 답변:
"${answer}"

#포춘쿠키 #AI #고민상담 #조언`;
      
      case 'twitter':
        return `🍀 포춘 쿠키 AI 답변 🍀

📝 역할: ${role}
💭 고민: ${concern}

✨ AI 답변:
"${answer}"

#포춘쿠키 #AI #고민상담`;
      
      default:
        return baseText;
    }
  };

  const shareToPlatform = async (platform) => {
    const text = createShareText(platform);
    const url = window.location.origin;

    try {
      switch (platform) {
        case 'kakao':
          // 카카오톡 공유 (개선된 템플릿 사용)
          const kakaoShared = shareToKakaoWithTemplate(role, concern, answer, url);
          if (!kakaoShared) {
            // 카카오 SDK가 초기화되지 않은 경우 Web Share API 사용
            if (navigator.share) {
              await navigator.share({
                title: '포춘 쿠키 AI 답변',
                text: text,
                url: url
              });
            } else {
              await navigator.clipboard.writeText(text);
              alert('카카오톡으로 공유할 내용이 클립보드에 복사되었습니다!');
            }
          }
          break;

        case 'instagram':
          // 인스타그램은 웹에서 직접 공유가 어려우므로 클립보드 복사
          await navigator.clipboard.writeText(text);
          alert('인스타그램으로 공유할 내용이 클립보드에 복사되었습니다!\n인스타그램 앱에서 붙여넣기 해주세요.');
          break;

        case 'facebook':
          // 페이스북 공유
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
          window.open(facebookUrl, '_blank', 'width=600,height=400');
          break;

        case 'twitter':
          // 트위터 공유
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
          window.open(twitterUrl, '_blank', 'width=600,height=400');
          break;

        case 'copy':
          await navigator.clipboard.writeText(text);
          alert('공유할 내용이 클립보드에 복사되었습니다!');
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('공유 실패:', error);
      alert('공유 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#666',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f5f5f5';
            e.target.style.color = '#333';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#666';
          }}
        >
          ×
        </button>

        {/* 제목 */}
        <h2 style={{
          textAlign: 'center',
          marginBottom: 24,
          fontSize: 24,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginTop: 0
        }}>
          🍀 공유하기
        </h2>

        {/* 소셜 미디어 버튼들 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 24
        }}>
          {/* 카카오톡 */}
          <Button
            onClick={() => shareToPlatform('kakao')}
            style={{
              background: 'linear-gradient(135deg, #FEE500 0%, #FFD700 100%)',
              color: '#3C1E1E',
              border: 'none',
              borderRadius: 12,
              padding: '16px 12px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(254, 229, 0, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 24 }}>💬</span>
            <span>카카오톡</span>
          </Button>

          {/* 인스타그램 */}
          <Button
            onClick={() => shareToPlatform('instagram')}
            style={{
              background: 'linear-gradient(135deg, #E4405F 0%, #C13584 50%, #833AB4 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 12px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(228, 64, 95, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 24 }}>📷</span>
            <span>인스타그램</span>
          </Button>

          {/* 페이스북 */}
          <Button
            onClick={() => shareToPlatform('facebook')}
            style={{
              background: 'linear-gradient(135deg, #1877F2 0%, #42A5F5 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 12px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(24, 119, 242, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 24 }}>📘</span>
            <span>페이스북</span>
          </Button>

          {/* 트위터 */}
          <Button
            onClick={() => shareToPlatform('twitter')}
            style={{
              background: 'linear-gradient(135deg, #1DA1F2 0%, #0D8BD9 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 12px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(29, 161, 242, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 24 }}>🐦</span>
            <span>트위터</span>
          </Button>
        </div>

        {/* 클립보드 복사 */}
        <Button
          onClick={() => shareToPlatform('copy')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '16px',
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <span style={{ fontSize: 20 }}>📋</span>
          <span>클립보드에 복사</span>
        </Button>
      </div>
    </div>
  );
};

export default ShareModal;
