
import PastConcernsPage from './PastConcernsPage';

function HistoryPage() {
  // 임시: userId를 localStorage에서 가져옴 (실제 로그인 연동 시 교체)
  const userId = localStorage.getItem('userId');
  return <PastConcernsPage userId={userId} />;
}

export default HistoryPage;
