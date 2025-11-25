import { Suspense, useState, useEffect } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import routes from "./config";
import LoadingSpinner from "../components/base/LoadingSpinner";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const element = useRoutes(routes);
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);

  const navigate = useNavigate();

  // OAuth 처리 상태 확인
  useEffect(() => {
    const checkOAuthStatus = () => {
      const oauthProcessed = sessionStorage.getItem('oauth_processed') === 'true';
      setIsOAuthProcessing(oauthProcessed);
    };

    // 초기 확인
    checkOAuthStatus();

    // CustomEvent로 OAuth 상태 변경 감지
    const handleOAuthStatusChange = (event: CustomEvent) => {
      setIsOAuthProcessing(event.detail.isProcessing);
    };

    window.addEventListener('oauth-status-change', handleOAuthStatusChange as EventListener);

    return () => {
      window.removeEventListener('oauth-status-change', handleOAuthStatusChange as EventListener);
    };
  }, []);

  // navigate 설정 (조건부 체크는 useEffect 안에서)
  useEffect(() => {
    if (!window.REACT_APP_NAVIGATE) {
      window.REACT_APP_NAVIGATE = navigate;
      navigateResolver(window.REACT_APP_NAVIGATE);
    }
  }, [navigate]);

  return (
    <Suspense fallback={
      <LoadingSpinner 
        message={isOAuthProcessing ? "로그인 처리 중..." : "로딩 중..."} 
        subMessage="잠시만 기다려주세요" 
      />
    }>
      {element}
    </Suspense>
  );
}

