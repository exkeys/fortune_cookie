function MenuOverlay({ onClose, onLogin, onHistory }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100 }} onClick={onClose}>
      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 20,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          padding: 0,
          minWidth: 160,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 32px',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#ffb300',
            fontSize: 18,
            borderBottom: '1px solid #ffe082',
            textAlign: 'center',
            width: '100%',
          }}
          onClick={onLogin}
        >
          로그인
        </div>
        <div
          style={{
            padding: '16px 32px',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#ffb300',
            fontSize: 18,
            textAlign: 'right',
            width: '100%',
          }}
          onClick={onHistory}
        >
          지난 고민 보기
        </div>
      </div>
    </div>
  );
}

export default MenuOverlay;
