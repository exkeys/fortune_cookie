interface PageTitleProps {}

export default function PageTitle({}: PageTitleProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">피드백</h1>
      <p className="text-base text-gray-600">
        포춘춘쿠키를 더 좋게 만들어주세요
      </p>
    </div>
  );
}