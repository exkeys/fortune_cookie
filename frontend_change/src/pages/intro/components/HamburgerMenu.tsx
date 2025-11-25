import { useState } from 'react';

interface MenuItemProps {
  icon: string;
  text: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function MenuItem({ icon, text, onClick, variant = 'default' }: MenuItemProps) {
  const variantStyles = {
    default: 'hover:bg-amber-50 text-amber-600 group-hover:text-amber-700',
    danger: 'hover:bg-red-50 text-red-600 group-hover:text-red-700'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 md:space-x-4 px-4 py-3 md:py-4 text-left rounded-lg transition-colors duration-300 group ${
        variant === 'danger' ? 'hover:bg-red-50' : 'hover:bg-amber-50'
      }`}
    >
      <i className={`${icon} ${variantStyles[variant]} text-xl md:text-2xl`}></i>
      <span className="font-medium text-gray-700 group-hover:text-gray-800 text-base md:text-lg lg:text-xl">
        {text}
      </span>
    </button>
  );
}

interface HamburgerMenuProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onPastConcerns: () => void;
  onFeedback: () => void;
  onSettings?: () => void;
  onAdmin?: () => void;
}

export default function HamburgerMenu({
  isLoggedIn,
  onLogin,
  onLogout,
  onPastConcerns,
  onFeedback,
  onSettings,
  onAdmin
}: HamburgerMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (callback: () => void) => {
    setShowMenu(false);
    callback();
  };

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <div className="absolute top-3 right-3 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105"
        >
          <i className={`${showMenu ? 'ri-close-line' : 'ri-menu-line'} text-amber-600 text-xl md:text-2xl`}></i>
        </button>
      </div>

      {/* 오버레이 메뉴 */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="fixed top-20 md:top-24 right-3 bg-white rounded-xl shadow-2xl z-50 p-6 md:p-8 min-w-64 md:min-w-72 animate-fade-in">
            <div className="space-y-3 md:space-y-4">
              {!isLoggedIn ? (
                <MenuItem
                  icon="ri-login-circle-line"
                  text="로그인"
                  onClick={() => handleMenuClick(onLogin)}
                />
              ) : (
                <>
                  {onSettings && (
                    <MenuItem
                      icon="ri-settings-3-line"
                      text="내 정보"
                      onClick={() => handleMenuClick(onSettings)}
                    />
                  )}
                  <MenuItem
                    icon="ri-history-line"
                    text="이전 운세 기록 보기"
                    onClick={() => handleMenuClick(onPastConcerns)}
                  />
                  <MenuItem
                    icon="ri-feedback-line"
                    text="피드백"
                    onClick={() => handleMenuClick(onFeedback)}
                  />
                  {onAdmin && (
                    <MenuItem
                      icon="ri-shield-user-line"
                      text="관리자"
                      onClick={() => handleMenuClick(onAdmin)}
                    />
                  )}
                  <MenuItem
                    icon="ri-logout-circle-line"
                    text="로그아웃"
                    onClick={() => handleMenuClick(onLogout)}
                    variant="danger"
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}