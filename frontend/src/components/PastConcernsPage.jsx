import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { useNavigation } from '../hooks/useNavigation';
import { useAnalytics } from '../hooks/useAnalytics';
import { supabase } from '../supabaseClient';


const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  background: #fffbe6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px;
  z-index: 0;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const CardBox = styled.div`
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 24px #0002;
  padding: 40px 24px 32px 24px;
  max-width: 600px;
  width: 100%;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
    margin: 10px 0;
    max-width: 100%;
  }
`;

const Title = styled.h2`
  color: #ff9800;
  font-size: 2rem;
  margin-bottom: 24px;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }
`;

const List = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Item = styled.div`
  background: #fffefb;
  border-radius: 16px;
  box-shadow: 0 2px 8px #0001;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  transition: box-shadow 0.2s;
  min-height: 90px;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 16px;
    min-height: 80px;
  }
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Persona = styled.div`
  color: #ff9800;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 4px;
`;

const Concern = styled.div`
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 4px;
  white-space: pre-line;
  word-break: break-word;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Answer = styled.div`
  color: #009688;
  font-size: 1rem;
  margin-bottom: 2px;
  word-break: break-word;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const DateText = styled.div`
  color: #bbb;
  font-size: 0.9rem;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: #e53935;
  font-size: 1.6rem;
  cursor: pointer;
  margin-left: 16px;
  transition: color 0.2s;
  &:hover {
    color: #b71c1c;
  }
`;

const BackButton = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #f57c00;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    top: 15px;
    left: 15px;
    padding: 10px 16px;
    font-size: 0.9rem;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  flex-wrap: wrap;
`;

const PageButton = styled.button`
  background: ${props => props.active ? '#ff9800' : '#fff'};
  color: ${props => props.active ? '#fff' : '#ff9800'};
  border: 2px solid #ff9800;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 40px;
  
  &:hover {
    background: ${props => props.active ? '#f57c00' : '#ff9800'};
    color: #fff;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PageInfo = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin: 0 16px;
  text-align: center;
`;


function PastConcernsPage({ onMenuClick = null }) {
  const [user, setUser] = useState(null);
  const [concernsLoading, setConcernsLoading] = useState(true);
  const { goTo } = useNavigation();
  const { trackPageEnter, trackPageExit } = useAnalytics();
  const [concerns, setConcerns] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // 페이지당 4개씩 표시

  // Supabase Auth로 사용자 정보 가져오기
  useEffect(() => {
    async function fetchUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          setUser(null);
        } else {
          setUser(data?.user || null);
        }
      } catch (err) {
        console.error('PastConcernsPage - 사용자 정보 가져오기 에러:', err);
        setUser(null);
      } finally {
        setConcernsLoading(false);
      }
    }
    
    fetchUser();
  }, []);

  // 페이지 진입/이탈 추적
  useEffect(() => {
    trackPageEnter('past_concerns');
    
    return () => {
      trackPageExit('past_concerns');
    };
  }, []);

  // 고민 목록 가져오기 (Supabase 직접)
  useEffect(() => {
    async function fetchConcerns() {
      setConcernsLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('ai_answers')
          .select('id, persona, concern, ai_response, is_saved, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message || '목록 불러오기 실패');
        } else {
          setConcerns(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('PastConcernsPage - 네트워크 오류:', e);
        setError('서버 오류');
      }
      setConcernsLoading(false);
    }
    if (user) {
      fetchConcerns();
    }
  }, [user]);

  // 사용자가 로그인되지 않았으면 로그인 안내 표시
  if (concernsLoading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2>로그인이 필요합니다</h2>
        <p>지난 고민을 보려면 먼저 로그인해주세요.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '20px'
          }}
        >
          로그인하기
        </button>
      </div>
    );
  }


  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('ai_answers')
        .delete()
        .eq('id', id);
      if (error) {
        alert('삭제 실패: ' + (error.message || '오류'));
        return;
      }
      setConcerns(concerns.filter(c => c.id !== id));
      const remainingItems = concerns.filter(c => c.id !== id);
      const totalPages = Math.ceil(remainingItems.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (e) {
      alert('삭제 실패');
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(concerns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConcerns = concerns.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const trailingActions = (id) => (
    <TrailingActions>
      <SwipeAction destructive onClick={() => handleDelete(id)}>
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: '#e53935',
          color: '#fff',
          fontSize: 24,
          fontWeight: 700,
          borderRadius: '0 12px 12px 0',
          gap: 8
        }}>
          🗑️ 삭제
        </div>
      </SwipeAction>
    </TrailingActions>
  );

  return (
    <Container>
      <BackButton onClick={goTo.home}>
        ← 뒤로가기
      </BackButton>
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
            onClick={onMenuClick}
          >
            &#9776;
          </button>
        </div>
      )}
      <CardBox>
        <Title>지난 고민 목록</Title>
        {concernsLoading ? (
          <div>불러오는 중...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : concerns.length === 0 ? (
          <div>저장된 고민이 없습니다.</div>
        ) : (
          <>
            <List>
              <SwipeableList threshold={0.2} type="IOS">
                {currentConcerns.map(item => (
                  <SwipeableListItem
                    key={item.id}
                    trailingActions={trailingActions(item.id)}
                  >
                    <Item>
                      <Info>
                        <Persona>{item.persona}</Persona>
                        <Concern>{item.concern}</Concern>
                        <Answer>{item.ai_response}</Answer>
                              <DateText>{new Date(item.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</DateText>
                      </Info>
                    </Item>
                  </SwipeableListItem>
                ))}
              </SwipeableList>
            </List>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <PaginationContainer>
                <PageButton
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ←
                </PageButton>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PageButton
                    key={page}
                    onClick={() => goToPage(page)}
                    active={currentPage === page}
                  >
                    {page}
                  </PageButton>
                ))}
                
                <PageButton
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  →
                </PageButton>
                
                <PageInfo>
                  {currentPage} / {totalPages} 페이지
                </PageInfo>
              </PaginationContainer>
            )}
          </>
        )}
      </CardBox>
    </Container>
  );
}

export default PastConcernsPage;
