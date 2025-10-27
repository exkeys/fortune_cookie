import Card from '../../../components/base/Card';

interface ConcernInputAreaProps {
  concern: string;
  charCount: number;
  maxChars: number;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function ConcernInputArea({ 
  concern, 
  charCount, 
  maxChars, 
  onInputChange 
}: ConcernInputAreaProps) {
  return (
    <Card className="p-2 md:p-2 lg:p-3 mb-3 max-w-3xl mx-auto">
      <div className="relative">
        <textarea
          value={concern}
          onChange={onInputChange}
          placeholder="예: 새로운 프로젝트를 시작하려고 하는데, 성공할 수 있을지 확신이 서지 않아요."
          className="w-full h-20 md:h-24 lg:h-28 p-2 text-xs md:text-sm border border-gray-200 rounded resize-none focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100 transition-all duration-300 text-gray-800 placeholder-gray-400"
        />
        <div className="absolute bottom-1 right-1 text-xs text-gray-400">
          {charCount}/{maxChars}
        </div>
      </div>
      
      {/* 글자 수 진행 바 */}
      <div className="mt-1">
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              charCount > maxChars * 0.8 ? 'bg-orange-400' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min((charCount / maxChars) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    </Card>
  );
}