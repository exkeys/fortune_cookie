import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { X, Calendar, AlertCircle, Mail } from 'lucide-react';
import { logger } from '../../utils/logger';
import { SUPPORT_EMAIL } from '../../constants';

// 공통 SupportSection 컴포넌트
const SupportSection = () => (
  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
    <div className="flex items-start gap-3">
      <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-gray-900 text-sm mb-1">도움이 필요하신가요?</p>
        <p className="text-gray-600 text-xs mb-2">관리자에게 문의해 주세요</p>
        <p className="text-blue-600 text-xs font-mono">{SUPPORT_EMAIL}</p>
      </div>
    </div>
  </div>
);

// 공통 ErrorModalContent 컴포넌트
interface ErrorModalContentProps {
  iconBgColor: 'bg-red-50' | 'bg-orange-50' | 'bg-yellow-50' | 'bg-purple-50';
  iconTextColor: 'text-red-500' | 'text-orange-500' | 'text-yellow-500' | 'text-purple-500';
  iconSvg: ReactNode;
  title: string;
  message: string;
  causes?: string[];
  detailContent?: string;
  bottomMessage?: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  onClose: () => void;
}

const ErrorModalContent = ({
  iconBgColor,
  iconTextColor,
  iconSvg,
  title,
  message,
  causes,
  detailContent,
  bottomMessage,
  actionButton,
  onClose
}: ErrorModalContentProps) => {
  return (
    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
      <div className="text-center p-6">
        {/* 아이콘 */}
        <div className="mb-5">
          <div className={`w-16 h-16 mx-auto ${iconBgColor} rounded-full flex items-center justify-center`}>
            <div className={`w-8 h-8 ${iconTextColor}`}>
              {iconSvg}
            </div>
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* 메시지 */}
        <p className="text-gray-500 text-sm leading-relaxed mb-3">
          {message}
        </p>

        {/* 가능한 원인 또는 상세 내용 */}
        {causes && (
          <div className="bg-gray-50 rounded-xl p-3 mb-5 text-left">
            <p className="text-xs text-gray-600 mb-1.5 font-semibold">가능한 원인:</p>
            <ul className="text-xs text-gray-600 space-y-0.5">
              {causes.map((cause, index) => (
                <li key={index}>• {cause}</li>
              ))}
            </ul>
          </div>
        )}

        {detailContent && (
          <div className="bg-gray-50 rounded-xl p-3 mb-5 text-left">
            <p className="text-xs text-gray-600 mb-1.5 font-semibold">상세 내용:</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              {detailContent}
            </p>
          </div>
        )}

        {/* 도움이 필요하신가요? */}
        <SupportSection />

        {/* 버튼 */}
        {actionButton ? (
          <button 
            onClick={actionButton.onClick}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md mb-2"
          >
            {actionButton.text}
          </button>
        ) : (
          <button 
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md mb-2"
          >
            확인
          </button>
        )}

        {/* 안내 문구 */}
        {bottomMessage && (
          <p className="text-gray-400 text-xs text-center">
            {bottomMessage}
          </p>
        )}
      </div>
    </div>
  );
};

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string; // 특별 스타일 모달에서는 사용하지 않음
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  cancelButtonText?: string; // 취소 버튼 텍스트 커스터마이징
  variant?: 'default' | 'dailyLimit'; // 모달 스타일 변형: dailyLimit은 일일 사용 제한 카운트다운 모달
  nextAvailableAt?: string | null; // 다음 이용 가능 시간 (ISO string, used_at 기준)
}

export default function AccessModal({
  isOpen,
  onClose,
  title,
  message,
  actionButton,
  cancelButtonText = "메인으로 돌아가기 🏠",
  variant = 'default',
  nextAvailableAt = null
}: AccessModalProps) {
  const isLoginRequired = title === '로그인 필요';
  const isDailyLimitStyle = variant === 'dailyLimit';
  const isFortuneCookieGuide = title === '포춘쿠키 이용 안내';
  const isPeriodNotSet = title === '이용 기간 미설정';
  const isApiError = title === 'API 연결 오류' || title === '서버 연결 실패';
  const isUserError = title === '사용자 정보 오류';
  const isJavaScriptError = title === 'JavaScript 오류';
  const isPermissionError = title === '접근 권한 오류';
  const isSchoolSelection = title === '학교 선택 필요';
  const isLoginError = title === '로그인 실패';
  const isServiceRestricted = title === '서비스 이용 제한';
  
  // JavaScript 에러 메시지에서 에러 내용 추출
  const extractJavaScriptError = (msg: string) => {
    const errorMatch = msg.match(/오류 내용:\s*(.+?)(?:\n\n|$)/s);
    return errorMatch ? errorMatch[1].trim() : '알 수 없는 오류';
  };
  
  // 이용 기간 미설정 모달에서 학교명 추출
  const extractSchoolName = (msg: string) => {
    const match = msg.match(/(.+?)의 포춘쿠키 서비스 이용 기간이/);
    return match ? match[1] : '해당 학교';
  };
  
  // 일일 제한 스타일: 다음 이용까지 남은 시간 계산
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    if (!isOpen || !isDailyLimitStyle) {
      return;
    }
    
    const calculateTimeLeft = () => {
      try {
        const now = new Date();
        
        // DB에서 받은 실제 이용 가능 시간(used_at 기준)이 있으면 사용
        let targetTime: Date;
        if (nextAvailableAt) {
          targetTime = new Date(nextAvailableAt);
          // invalid date 체크
          if (isNaN(targetTime.getTime())) {
            logger.warn('nextAvailableAt 파싱 실패, fallback 사용:', nextAvailableAt);
            targetTime = new Date(now.getTime() + 1 * 60 * 1000);
          }
        } else {
          // fallback: 테스트용 1분 후 (현재 시간 + 1분)
          targetTime = new Date(now.getTime() + 1 * 60 * 1000);
        }
        
        // 목표 시간 - 현재 시간 = 남은 시간 (예: 9시 1분 - 9시 30초 = -30초 또는 30초 남음)
        const diff = targetTime.getTime() - now.getTime();
        
        // 음수가 되면 0으로 설정
        if (diff <= 0 || isNaN(diff)) {
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        
        // 총 초를 구함 (예: 30768ms = 30.768초 → 30초)
        const totalSeconds = Math.floor(diff / 1000);
        
        // NaN 체크
        if (isNaN(totalSeconds) || totalSeconds < 0) {
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        
        // 시간, 분, 초로 변환
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        // 최종 값 검증 (NaN 방지)
        return {
          hours: isNaN(hours) ? 0 : Math.max(0, hours),
          minutes: isNaN(minutes) ? 0 : Math.max(0, minutes),
          seconds: isNaN(seconds) ? 0 : Math.max(0, seconds)
        };
      } catch (error) {
        console.error('시간 계산 오류:', error);
        return { hours: 0, minutes: 0, seconds: 0 };
      }
    };
    
    // 즉시 계산
    setTimeLeft(calculateTimeLeft());
    
    // 1초마다 업데이트 (더 정확한 카운트다운)
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, isDailyLimitStyle, nextAvailableAt]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 transition-opacity ${isDailyLimitStyle || isFortuneCookieGuide || isPeriodNotSet || isApiError || isUserError || isJavaScriptError || isPermissionError || isSchoolSelection || isLoginError || isServiceRestricted ? 'bg-gray-900 bg-opacity-50' : 'bg-black bg-opacity-50'}`}
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div
          className={`relative rounded-2xl shadow-2xl ${isFortuneCookieGuide ? 'max-w-md' : isPeriodNotSet || isApiError || isUserError || isJavaScriptError || isPermissionError || isSchoolSelection || isLoginError || isServiceRestricted ? 'max-w-md' : 'max-w-xl'} w-full mx-4 transform transition-all overflow-hidden ${
            isDailyLimitStyle || isFortuneCookieGuide || isPeriodNotSet ? 'bg-transparent' : 'bg-white'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 닫기 X 버튼 (일일 제한 스타일, 포춘쿠키 안내 스타일, 이용 기간 미설정 스타일, API 에러 스타일, 사용자 정보 오류 스타일, JavaScript 오류 스타일, 접근 권한 오류 스타일, 학교 선택 스타일, 로그인 실패 스타일, 서비스 이용 제한 스타일이 아닐 때만 표시) */}
          {!isDailyLimitStyle && !isFortuneCookieGuide && !isPeriodNotSet && !isApiError && !isUserError && !isJavaScriptError && !isPermissionError && !isSchoolSelection && !isLoginError && !isServiceRestricted && (
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 shadow-sm ring-1 ring-black/5 transition"
            >
              ×
            </button>
          )}
          {isLoginRequired ? (
            <>
              {/* 상단 그린 헤더 */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
                <div className="text-5xl mb-3">🔐</div>
                <h3 className="text-xl font-bold text-white">로그인이 필요합니다</h3>
              </div>

              <div className="p-8">
                {/* 체크리스트 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 font-medium mb-2">로그인하면 이런 것들을 할 수 있어요</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> 내 운세 기록 저장
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> 언제든 다시보기
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> AI 맞춤 조언 받기
                    </li>
                  </ul>
                </div>

                {/* 버튼들 */}
                {actionButton && (
                  <button
                    onClick={actionButton.onClick}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-lg transition-colors mb-3"
                  >
                    {actionButton.text}
                  </button>
                )}

                {/* 하단 설명 */}
                <p className="text-xs text-center text-gray-500 mt-4">3초만에 시작할 수 있어요</p>
              </div>
            </>
          ) : isDailyLimitStyle ? (
            <>
              {/* 일일 제한 스타일 모달 (카운트다운 표시) */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">오늘의 포춘쿠키</h2>
                  <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition"
                  >
                    ×
                  </button>
                </div>
                
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
                    이용 완료
                  </div>
                  <div className="text-6xl mb-6">✨</div>
                  <p className="text-xl font-medium mb-3">오늘의 포춘쿠키를 받으셨습니다</p>
                  <p className="text-gray-400 text-sm">매일 자정 새로운 포춘쿠키가 준비됩니다</p>
                </div>
                
                <div className="bg-white/10 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">다음 이용</span>
                    <span className="text-white font-semibold">
                      {timeLeft.hours > 0 ? `${timeLeft.hours}시간 ` : ''}
                      {timeLeft.minutes > 0 ? `${timeLeft.minutes}분 ` : ''}
                      {timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 
                        ? '이용 가능' 
                        : `${timeLeft.seconds}초 후`}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {actionButton && (
                    <button 
                      onClick={actionButton.onClick}
                      className="bg-white text-gray-900 py-4 rounded-xl font-semibold hover:bg-gray-100 transition"
                    >
                      {actionButton.text}
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="text-gray-300 py-4 rounded-xl font-semibold hover:bg-white/5 transition border border-gray-600"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </>
          ) : isFortuneCookieGuide ? (
            <>
              {/* 포춘쿠키 이용 안내 모달 */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 w-full text-white shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">포춘쿠키 이용 안내</h2>
                  <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="text-center mb-8">
                  <div className="text-6xl mb-6">🎁</div>
                  <p className="text-xl font-medium mb-3">하루에 한 번만 사용 가능합니다</p>
                  <p className="text-gray-400 text-sm">
                    포춘쿠키를 받으시겠어요?
                  </p>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-yellow-400">⚠️</span>
                    <span className="text-gray-300 text-sm">오늘 한 번만 받을 수 있어요</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {actionButton && (
                    <button 
                      onClick={() => {
                        actionButton.onClick();
                      }}
                      className="bg-white text-gray-900 py-4 rounded-xl font-semibold hover:bg-gray-100 transition"
                    >
                      확인
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="text-gray-300 py-4 rounded-xl font-semibold hover:bg-white/5 transition border border-gray-600"
                  >
                    취소
                  </button>
                </div>
              </div>
            </>
          ) : isPeriodNotSet ? (
            <>
              {/* 네이버 스타일 - 이용 기간 미설정 모달 */}
              <div className="bg-white rounded-2xl p-6 w-full">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar size={20} className="text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">이용 기간 미설정</h3>
                  <button 
                    onClick={onClose}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">학교명</span>
                      <span className="text-sm font-bold text-gray-900">{extractSchoolName(message || '')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">서비스 상태</span>
                      <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        이용 기간 미설정
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-800 font-medium mb-1">관리자 설정 필요</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          관리자가 이용 기간을 설정하면 서비스를 이용하실 수 있습니다. 관리자에게 문의해 주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full bg-green-500 text-white py-3.5 rounded-lg font-semibold hover:bg-green-600 transition"
                >
                  확인
                </button>
              </div>
            </>
          ) : isApiError ? (
            <>
              {/* 서버 연결 실패 모달 */}
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
                <div className="text-center p-6">
                  {/* 아이콘 */}
                  <div className="mb-5">
                    <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                      </svg>
                    </div>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {title === 'API 연결 오류' ? '서버 연결 실패' : title}
                  </h3>

                  {/* 메시지 */}
                  <p className="text-gray-500 text-sm leading-relaxed mb-3">
                    백엔드 서버에 연결할 수 없습니다.
                  </p>

                  {/* 에러 상세 정보 */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-5 text-left">
                    <p className="text-xs text-gray-600 mb-1.5 font-semibold">가능한 원인:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      <li>• 백엔드 서버가 실행되지 않음</li>
                      <li>• 네트워크 연결 문제</li>
                      <li>• 프록시 설정 오류</li>
                    </ul>
                  </div>

                  {/* 도움이 필요하신가요? */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm mb-1">도움이 필요하신가요?</p>
                        <p className="text-gray-600 text-xs mb-2">관리자에게 문의해 주세요</p>
                        <p className="text-blue-600 text-xs font-mono">{SUPPORT_EMAIL}</p>
                      </div>
                    </div>
                  </div>

                  {/* 버튼 */}
                  <button 
                    onClick={onClose}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md mb-2"
                  >
                    확인
                  </button>

                  {/* 안내 문구 */}
                  <p className="text-gray-400 text-xs text-center">
                    서버 상태를 확인해 주세요.
                  </p>
                </div>
              </div>
            </>
          ) : isJavaScriptError ? (
            <>
              {/* JavaScript 오류 모달 */}
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
                <div className="text-center p-6">
                  {/* 아이콘 */}
                  <div className="mb-5">
                    <div className="w-16 h-16 mx-auto bg-purple-50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {title}
                  </h3>

                  {/* 메시지 */}
                  <p className="text-gray-500 text-sm leading-relaxed mb-3">
                    코드 실행 중 오류가 발생했습니다.
                  </p>

                  {/* 에러 상세 정보 */}
                  {(() => {
                    const errorContent = extractJavaScriptError(message || '');
                    return (
                      <div className="bg-gray-50 rounded-xl p-3 mb-5 text-left">
                        <p className="text-xs text-gray-600 mb-1 font-semibold">오류 내용:</p>
                        <p className="text-xs text-gray-700 font-mono bg-gray-100 p-2 rounded break-all">
                          {errorContent}
                        </p>
                      </div>
                    );
                  })()}

                  {/* 안내 문구 */}
                  <p className="text-gray-400 text-xs mb-6">
                    개발자 도구(F12) 콘솔을 확인해 주세요.
                  </p>

                  {/* 버튼 */}
                  <button 
                    onClick={onClose}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    확인
                  </button>
                </div>
              </div>
            </>
          ) : isPermissionError ? (
            <ErrorModalContent
              iconBgColor="bg-orange-50"
              iconTextColor="text-orange-500"
              iconSvg={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title={title}
              message="이 기능에 접근할 권한이 없습니다."
              causes={[
                '로그인이 필요합니다',
                '권한이 부족합니다',
                '세션이 만료되었습니다'
              ]}
              bottomMessage="관리자에게 문의하거나 다시 로그인해 주세요."
              actionButton={actionButton}
              onClose={onClose}
            />
          ) : isUserError ? (
            <ErrorModalContent
              iconBgColor="bg-orange-50"
              iconTextColor="text-orange-500"
              iconSvg={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              title={title}
              message="사용자 정보를 불러올 수 없습니다."
              causes={[
                '세션이 만료되었습니다',
                '로그인 정보가 유효하지 않습니다',
                '서버와의 연결이 끊어졌습니다'
              ]}
              bottomMessage="다시 로그인해 주세요."
              onClose={onClose}
            />
          ) : isSchoolSelection ? (
            <>
              {/* 학교 선택 필요 모달 */}
              <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
                <div className="text-center p-6">
                  {/* 아이콘 */}
                  <div className="mb-5">
                    <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {title}
                  </h3>

                  {/* 메시지 */}
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    포춘쿠키 서비스를 이용하려면<br />
                    먼저 학교를 선택해야 합니다.
                  </p>

                  {/* 버튼 */}
                  {actionButton && (
                    <button 
                      onClick={actionButton.onClick}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md mb-2"
                    >
                      {actionButton.text}
                    </button>
                  )}

                  <button 
                    onClick={onClose}
                    className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors text-sm"
                  >
                    나중에 하기
                  </button>
                </div>
              </div>
            </>
          ) : isLoginError ? (
            <ErrorModalContent
              iconBgColor="bg-yellow-50"
              iconTextColor="text-yellow-500"
              iconSvg={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title={title}
              message="로그인 중 문제가 발생했습니다."
              causes={[
                '아이디 또는 비밀번호가 올바르지 않습니다',
                '네트워크 연결이 불안정합니다',
                '서버에 일시적인 문제가 있습니다'
              ]}
              bottomMessage="잠시 후 다시 시도해 주세요."
              onClose={onClose}
            />
          ) : isServiceRestricted ? (
            <ErrorModalContent
              iconBgColor="bg-red-50"
              iconTextColor="text-red-500"
              iconSvg={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              }
              title={title}
              message="서비스 이용이 일시적으로 제한되었습니다."
              detailContent={message ? (() => {
                const reasonMatch = message.match(/상세 내용:\s*(.+?)(?:\n\n|$)/s);
                return reasonMatch ? reasonMatch[1].trim() : '서비스 이용이 제한되었습니다.';
              })() : '서비스 이용이 제한되었습니다.'}
              bottomMessage="문제가 지속되면 관리자에게 문의해 주세요."
              onClose={onClose}
            />
          ) : (
            <>
              {/* 기본(기존) 모달 */}
              <div className="text-center pt-8 pb-4">
                <div className="text-6xl mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              </div>
              <div className="px-6 pb-6">
                {message && (
                  <div className="text-gray-600 text-center leading-relaxed mb-6 whitespace-pre-line">{message}</div>
                )}
                <div className="flex flex-row gap-4 justify-center">
                  {actionButton && (
                    <button
                      onClick={actionButton.onClick}
                      className="flex-1 max-w-xs px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
                    >
                      {actionButton.text}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 max-w-xs px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    {cancelButtonText}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
