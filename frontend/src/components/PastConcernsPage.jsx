import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';


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
  justify-content: center;
  padding: 0;
  z-index: 0;
`;

const CardBox = styled.div`
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 24px #0002;
  padding: 40px 24px 32px 24px;
  max-width: 500px;
  width: 95vw;
  margin: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h2`
  color: #ff9800;
  font-size: 2rem;
  margin-bottom: 24px;
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
  padding: 20px 20px 16px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  transition: box-shadow 0.2s;
  min-height: 90px;
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
`;

const Answer = styled.div`
  color: #009688;
  font-size: 1rem;
  margin-bottom: 2px;
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


function PastConcernsPage({ userId }) {
  // userId가 없으면 아무것도 렌더링하지 않음 (빈 화면)
  if (!userId) return null;

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
