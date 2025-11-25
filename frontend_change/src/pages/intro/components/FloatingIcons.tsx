export default function FloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        >
          <i className={`${['ri-star-fill', 'ri-heart-fill', 'ri-sparkle-fill'][Math.floor(Math.random() * 3)]} text-amber-300 text-opacity-30 text-2xl`}></i>
        </div>
      ))}
    </div>
  );
}