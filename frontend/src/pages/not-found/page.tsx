import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, HelpCircle, Home, Mail } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="p-16 md:p-20 text-center space-y-8">
            {/* Icon */}
            <div className="flex justify-center mb-2">
              <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-14 h-14 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
                페이지를 찾을 수 없습니다
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
                요청하신 페이지가 존재하지 않거나<br />이동되었을 수 있습니다
              </p>
            </div>

            {/* Button */}
            <div className="pt-4">
              <button 
                onClick={() => navigate('/')}
                className="px-10 py-3.5 bg-blue-600 text-white text-base font-medium rounded-xl transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-98 min-w-[200px]"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50/80 backdrop-blur-sm px-8 py-6 border-t border-gray-200/50">
            <div className="flex justify-end gap-6 text-sm">
              <button 
                onClick={() => setShowHelpModal(true)}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                도움말
              </button>
              <button 
                onClick={() => navigate('/feedback')}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                문의하기
              </button>
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">오류 코드: 404</p>
        </div>
      </div>

      {/* 도움말 모달 */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle size={24} />
                  <h2 className="text-xl font-bold">도움말</h2>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="닫기"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  404 오류가 발생했어요
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  요청하신 페이지를 찾을 수 없습니다. 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">다음 방법을 시도해보세요:</p>
                <ul className="text-sm text-gray-700 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>주소창의 URL을 확인해주세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>홈으로 돌아가서 다시 시작해보세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>브라우저를 새로고침해보세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>문제가 계속되면 문의하기를 이용해주세요</span>
                  </li>
                </ul>
              </div>

              {/* 버튼들 */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowHelpModal(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Home size={18} />
                  홈으로 돌아가기
                </button>
                <button
                  onClick={() => {
                    setShowHelpModal(false);
                    navigate('/feedback');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200"
                >
                  <Mail size={18} />
                  문의하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}