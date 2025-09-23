
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const showBackButton = location.pathname !== '/';
  
  return (
    <header className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-4 py-4">
      <div className="w-full">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <i className="ri-arrow-left-line text-amber-600 text-xl md:text-2xl"></i>
            </button>
          )}
          
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent cursor-pointer"
            style={{ fontFamily: "Pacifico, serif" }}
            onClick={() => navigate('/')}
          >
            운세쿠키
          </h1>
        </div>
      </div>
    </header>
  );
}
