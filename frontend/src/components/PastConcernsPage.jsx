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


function PastConcernsPage({ userId }) {
  // userId가 없으면 아무것도 렌더링하지 않음 (빈 화면)
  if (!userId) {
    return null;
  }

  const { goTo } = useNavigation();
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchConcerns() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:4000/api/concerns?userId=${userId}`);
        const data = await res.json();
        if (res.ok) {
          setConcerns(Array.isArray(data.concerns) ? data.concerns : []);
        } else {
          setError(data.error || '목록 불러오기 실패');
        }
      } catch (e) {
        setError('서버 오류');
      }
      setLoading(false);
    }
    fetchConcerns();
  }, [userId]);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/concerns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConcerns(concerns.filter(c => c.id !== id));
      } else {
        alert('삭제 실패');
      }
    } catch {
      alert('서버 오류');
    }
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
      <CardBox>
        <Title>지난 고민 목록</Title>
        {loading ? (
          <div>불러오는 중...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : concerns.length === 0 ? (
          <div>저장된 고민이 없습니다.</div>
        ) : (
          <List>
            <SwipeableList threshold={0.2} type="IOS">
              {concerns.map(item => (
                <SwipeableListItem
                  key={item.id}
                  trailingActions={trailingActions(item.id)}
                >
                  <Item>
                    <Info>
                      <Persona>{item.persona}</Persona>
                      <Concern>{item.concern}</Concern>
                      <Answer>{item.ai_response}</Answer>
                      <DateText>{new Date(item.created_at).toLocaleString()}</DateText>
                    </Info>
                  </Item>
                </SwipeableListItem>
              ))}
            </SwipeableList>
          </List>
        )}
      </CardBox>
    </Container>
  );
}

export default PastConcernsPage;
