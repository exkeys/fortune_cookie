function MainButton({ children, onClick }) {
  const defaultStyle = {
    padding: '18px 60px',
    fontSize: 24,
    borderRadius: 40,
    border: 'none',
    background: '#fff',
    color: '#ffb300',
    fontWeight: 800,
    marginTop: 0,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    letterSpacing: 2,
    transition: 'background 0.2s, color 0.2s',
    marginLeft: '-60px', 
  };
  return (
    <button
      style={defaultStyle}
      onClick={onClick}
      onMouseOver={e => {
        e.target.style.background = '#ffe082';
        e.target.style.color = '#ff9800';
      }}
      onMouseOut={e => {
        e.target.style.background = '#fff';
        e.target.style.color = '#ffb300';
      }}
    >
      {children}
    </button>
  );
}

export default MainButton;
