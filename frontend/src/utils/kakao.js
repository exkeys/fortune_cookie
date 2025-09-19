// 카카오톡 SDK 초기화 및 공유 유틸리티

const KAKAO_APP_KEY = '2e6b2a19fc93c2c6205051ecbdac861f';

export const initKakao = () => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_APP_KEY);
    console.log('카카오 SDK 초기화 완료');
  }
};

export const shareToKakao = (text, url) => {
  if (window.Kakao && window.Kakao.isInitialized()) {
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: text,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    });
    return true;
  }
  return false;
};

// 카카오톡 공유를 위한 커스텀 템플릿 (더 예쁘게)
export const shareToKakaoWithTemplate = (role, concern, answer, url) => {
  if (window.Kakao && window.Kakao.isInitialized()) {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '🍀 포춘 쿠키 AI 답변',
        description: `역할: ${role}\n고민: ${concern}\n\n✨ AI 답변:\n"${answer}"`,
        imageUrl: `${url}/fortune-cookie-preview.jpg`, // 썸네일 이미지
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
      buttons: [
        {
          title: '포춘 쿠키 체험하기',
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
      ],
    });
    return true;
  }
  return false;
};
