import React, { useState, useRef } from 'react';
import soundBgs from '../assets/sounds/sound_bgs.mp3';
import soundCrack from '../assets/sounds/sound_crack.mp3';
import imageCookie from '../assets/images/image_cookie.png';
import imageCookieAlt from '../assets/images/image_cookie_alt.png';
import imageSlip from '../assets/images/image_slip.png';
import messages from '../assets/messages/message.json';




function FortuneCookie({ answer }) {
  const [isCracked, setIsCracked] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFinish, setIsFinish] = useState(false);
  const [message, setMessage] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 280 });
  const bgAudioRef = useRef(null);
  const crackAudioRef = useRef(null);

  const crack = (e) => {
    e.stopPropagation();
    setIsCracked(true);
    if (crackAudioRef.current) {
      crackAudioRef.current.play();
    }
    getMessage();
  };

  const open = (e) => {
    e.stopPropagation();
    setIsOpen(true);
    setTimeout(() => {
      setIsFinish(true);
    }, 750);
  };

  // 메시지 길이에 따른 컨테이너 크기 계산 (한 줄로 강제, 충분한 여백)
  const calculateContainerSize = (text) => {
    if (!text) return { width: 1200, height: 280 };
    
    const textLength = text.length;
    
    // 텍스트 길이에 따라 종이를 충분히 크게 만들어 한 줄로 강제
    // 각 문자당 약 20-25px 정도의 공간을 확보
    const estimatedWidth = Math.max(800, textLength * 25 + 200);
    const estimatedHeight = Math.max(200, 280);
    
    if (textLength <= 15) {
      return { width: 1000, height: 240 };
    } else if (textLength <= 25) {
      return { width: 1200, height: 280 };
    } else if (textLength <= 35) {
      return { width: 1500, height: 320 };
    } else if (textLength <= 45) {
      return { width: 1800, height: 360 };
    } else if (textLength <= 55) {
      return { width: 2100, height: 400 };
    } else if (textLength <= 65) {
      return { width: 2400, height: 440 };
    } else if (textLength <= 75) {
      return { width: 2700, height: 480 };
    } else {
      return { width: 3000, height: 520 };
    }
  };

  const getMessage = () => {
    let newMessage = '';
    if (answer) {
      newMessage = answer;
    } else {
      const keys = Object.keys(messages);
      const index = Math.floor(Math.random() * keys.length);
      newMessage = messages[index];
    }
    
    setMessage(newMessage);
    // 메시지 길이에 따라 컨테이너 크기 조정
    setContainerSize(calculateContainerSize(newMessage));
  };

  return (
    <div className="min-h-screen" style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative'
    }}>
      <audio ref={bgAudioRef} src={soundBgs} preload="auto" />
      <audio ref={crackAudioRef} src={soundCrack} preload="auto" />
      <div className="box-container flex justify-center relative transition duration-500" style={{ 
        width: 700, 
        height: 520, 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* 포춘쿠키 애니메이션 */}
        {!isCracked && (
          <div className="box-cookie absolute transition-opacity duration-500" style={{ opacity: 1, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <img
              src={imageCookie}
              alt="fortune cookie"
              style={{ width: 480, height: 420, cursor: 'pointer', userSelect: 'none' }}
              onClick={crack}
            />
          </div>
        )}
        {isCracked && !isOpen && (
          <div className="box-cookie-alt absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <img
              src={imageCookieAlt}
              alt="cracked fortune cookie"
              style={{ width: 480, height: 420, cursor: 'pointer', userSelect: 'none', animation: 'ping 0.7s' }}
              onClick={open}
            />
          </div>
        )}
        {isOpen && (
          <div className="box-slip absolute flex items-center justify-center" style={{ 
            width: containerSize.width, 
            height: containerSize.height, 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.5s ease-in-out'
          }}>
            <img src={imageSlip} alt="slip" style={{ 
              width: containerSize.width, 
              height: containerSize.height, 
              position: 'absolute', 
              left: 0, 
              top: 0 
            }} />
            <div
              className="fortune-message"
              style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                transform: 'translate(0, -50%)',
                width: '100%',
                height: `calc(100% - 100px)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: Math.max(16, Math.min(28, containerSize.width / 60)),
                color: '#333',
                fontWeight: 600,
                textAlign: 'center',
                wordBreak: 'keep-all',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'visible',
                opacity: isFinish ? 1 : 0,
                transition: 'all 0.5s ease-in-out',
                zIndex: 2,
                padding: '0 100px',
                margin: '0',
                boxSizing: 'border-box'
              }}
            >
              {message}
            </div>
          </div>
        )}
      </div>
      
      {/* CSS 스타일 - 웹 전용 */}
      <style jsx>{`
        .fortune-message {
          /* 웹에서만 사용하므로 모바일 고려 없음 */
          text-align: center !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }
        
        .box-slip {
          /* 웹에서만 사용하므로 반응형 제거 */
          transition: all 0.5s ease-in-out !important;
        }
      `}</style>
    </div>
  );
}

export default FortuneCookie;
