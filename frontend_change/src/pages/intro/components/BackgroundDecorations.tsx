export default function BackgroundDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-200 bg-opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-orange-200 bg-opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 bg-opacity-10 rounded-full blur-3xl"></div>
    </div>
  );
}