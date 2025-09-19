import MainButton from './MainButton';
import PageLayout from './common/PageLayout';
import { useNavigation } from '../hooks/useNavigation';

const MainPage = ({ onMenuClick }) => {
  const { goTo } = useNavigation();

  // 디버깅: onMenuClick prop 확인
  console.log('MainPage - onMenuClick:', onMenuClick);

  return (
    <PageLayout title="어떤 고민을 하고 있나요?">
      {onMenuClick && (
        <div style={{ position: 'absolute', top: 16, right: 32, zIndex: 200 }}>
          <button
            aria-label="메뉴"
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 36, 
              cursor: 'pointer', 
              color: '#ff9800', 
              padding: 8 
            }}
            onClick={() => {
              console.log('MainPage - 메뉴 버튼 클릭됨');
              onMenuClick();
            }}
          >
            &#9776;
          </button>
        </div>
      )}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <MainButton onClick={() => goTo.role()}>
          다음
        </MainButton>
      </div>
    </PageLayout>
  );
};

export default MainPage;