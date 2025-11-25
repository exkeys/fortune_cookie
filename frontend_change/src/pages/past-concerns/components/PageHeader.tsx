interface PageHeaderProps {
  totalCount: number;
}

export default function PageHeader({ totalCount }: PageHeaderProps) {
  return (
    <div className="mb-2">
      <div className="text-center mb-4">
        <h1 className="text-lg lg:text-xl xl:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 mb-2">
          운세 기록 보관함
        </h1>
        <p className="text-sm lg:text-base xl:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          지금까지 받은 <span className="font-bold text-amber-600">{totalCount}개</span>의 소중한 운세를 체계적으로 관리하고 언제든 다시 확인하세요
        </p>
        <div className="flex items-center justify-center space-x-1 mt-1">
          <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}