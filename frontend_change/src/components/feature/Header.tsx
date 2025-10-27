
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  disableBackButton?: boolean;
  disableHomeButton?: boolean;
}

export default function Header({ disableBackButton = false, disableHomeButton = false }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  
  const showBackButton = location.pathname !== '/';
  
  const handleBackClick = () => {
    // 비활성화된 경우 🚫 표시 후 클릭 무시
    if (disableBackButton) {
      // 임시로 🚫 표시를 보여주기 위한 효과
      const button = document.querySelector('.back-button') as HTMLElement;
      if (button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<span style="font-size: 1.5rem;">🚫</span>';
        setTimeout(() => {
          button.innerHTML = originalContent;
        }, 500);
      }
      console.log('🚫 뒤로가기 버튼이 비활성화되었습니다');
      return;
    }
    
    // past-concerns 페이지에서는 홈으로 이동
    if (location.pathname === '/past-concerns') {
      navigate('/');
    } else {
      navigate(-1);
    }
  };
  
  return (
    <header className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-4 py-4">
      <div className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="back-button w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                title="뒤로가기"
              >
                <i className="ri-arrow-left-line text-amber-600 text-lg md:text-xl"></i>
              </button>
            )}
            
            <h1 
              className={`text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent ${disableHomeButton ? '' : 'cursor-pointer'}`}
              style={{ fontFamily: "Pacifico, serif" }}
              onClick={() => {
                if (!disableHomeButton) {
                  navigate('/');
                }
              }}
            >
              포춘쿠키
            </h1>
          </div>

          {/* 설정 버튼 (로그인된 경우에만 표시) */}
          {isLoggedIn && location.pathname !== '/settings' && (
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              title="설정"
            >
              <i className="ri-settings-3-line text-amber-600 text-lg md:text-xl"></i>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
