interface PageTitleProps {}

export default function PageTitle({}: PageTitleProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 mb-4">
        어떤 역할로 상담받고 싶으신가요?
      </h1>
      <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600">
        선택한 역할에 맞는 맞춤형 조언을 받을 수 있습니다
      </p>
    </div>
  );
}