import { BrowserRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './router'
import { useSessionUsage } from './hooks/useSessionUsage'
import { handlePageUnload } from './utils/dataCleanup'

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분간 데이터 신선함 유지
      gcTime: 10 * 60 * 1000, // 10분간 캐시 보관 (cacheTime -> gcTime in v5)
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 재요청 비활성화
      retry: 1, // 실패 시 1번만 재시도
    },
  },
})

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={__BASE_PATH__}>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App