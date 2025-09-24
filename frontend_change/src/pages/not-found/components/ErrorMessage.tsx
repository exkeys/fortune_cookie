interface ErrorMessageProps {}

export default function ErrorMessage({}: ErrorMessageProps) {
  return (
    <div className="text-center">
      <div className="text-9xl md:text-[12rem] lg:text-[15rem] xl:text-[18rem] mb-8">
        🍪
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-700 mb-6">
        앗, 페이지를 찾을 수 없어요!
      </h2>
      <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
        요청하신 페이지가 존재하지 않거나<br />
        이동되었을 수 있습니다
      </p>
    </div>
  );
}