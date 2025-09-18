import MainButton from './MainButton';
import PageLayout from './common/PageLayout';
import { useNavigation } from '../hooks/useNavigation';

const MainPage = () => {
  const { goTo } = useNavigation();

  return (
    <PageLayout title="어떤 고민을 하고 있나요?">
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <MainButton onClick={() => goTo.role()}>
          다음
        </MainButton>
      </div>
    </PageLayout>
  );
};

export default MainPage;