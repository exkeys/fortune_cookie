import { BrowserRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { AppRoutes } from './router'
import { useSessionUsage } from './hooks/useSessionUsage'
import { handlePageUnload } from './utils/dataCleanup'

function App() {
  useSessionUsage()

  useEffect(() => {
    // 앱 종료 시 임시 데이터 정리
    const cleanup = () => {
      handlePageUnload();
    };

    // 페이지 언로드 이벤트 등록
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
    };
  }, []);

  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App