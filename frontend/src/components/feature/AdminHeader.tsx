import { useNavigate, useLocation } from 'react-router-dom';
import { useResponsive } from '@/hooks/useResponsive';

interface AdminHeaderProps {
  disableBackButton?: boolean;
}

export default function AdminHeader({ disableBackButton = false }: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();

  const showBackButton = location.pathname !== '/';

  const handleBackClick = () => {
    if (disableBackButton) return;
    navigate(-1);
  };

  if (isMobile) return null;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3">
      <div className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="back-button w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                title="뒤로가기"
              >
                <i className="ri-arrow-left-line text-lg"></i>
              </button>
            )}

            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              관리자
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}

