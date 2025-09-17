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

  const getMessage = () => {
    if (answer) {
      setMessage(answer);
    } else {
      const keys = Object.keys(messages);
      const index = Math.floor(Math.random() * keys.length);
      setMessage(messages[index]);
    }
  };

  return (
    <div className="min-h-screen" style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <audio ref={bgAudioRef} src={soundBgs} preload="auto" />
      <audio ref={crackAudioRef} src={soundCrack} preload="auto" />
  <div className="box-container flex justify-center relative transition duration-500" style={{ width: 700, height: 520, position: 'relative' }}>
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
          <div className="box-slip absolute flex items-center justify-center" style={{ width: 800, height: 220, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <img src={imageSlip} alt="slip" style={{ width: 800, height: 220, position: 'absolute', left: 0, top: 0 }} />
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: '#333',
                fontWeight: 600,
                padding: '0 60px',
                textAlign: 'center',
                wordBreak: 'break-word',
                lineHeight: 1.3,
                whiteSpace: 'pre-line',
                overflowWrap: 'break-word',
                opacity: isFinish ? 1 : 0,
                transition: 'opacity 0.5s',
                zIndex: 2,
                maxHeight: '100%',
                overflowY: 'auto'
              }}
            >
              {message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default FortuneCookie;
