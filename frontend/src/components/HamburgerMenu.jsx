function HamburgerMenu({ onClick }) {
  return (
  <div style={{ position: 'absolute', top: 32, right: 30, zIndex: 20 }}>
      <button
        aria-label="메뉴"
        style={{ background: 'none', border: 'none', fontSize: 36, cursor: 'pointer', color: '#fff', padding: 8 }}
        onClick={onClick}
      >
        &#9776;
      </button>
    </div>
  );
}

export default HamburgerMenu;
