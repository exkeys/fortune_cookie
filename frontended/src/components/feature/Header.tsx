
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const showBackButton = location.pathname !== '/';
  
  return (
    <header className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <i className="ri-arrow-left-line text-amber-600 text-lg"></i>
            </button>
          )}
          
          <h1 
            className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent cursor-pointer"
            style={{ fontFamily: "Pacifico, serif" }}
            onClick={() => navigate('/')}
          >
            운세쿠키
          </h1>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={() => navigate('/past-concerns')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <i className="ri-history-line text-amber-600 text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
