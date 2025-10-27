import Card from '../../../components/base/Card';
import ShareButtons from './ShareButtons';
import ActionButtons from './ActionButtons';
import { useState } from 'react';
import AiFeedModal from './AiFeedModal';

interface FortuneResultDisplayProps {
  fortuneMessage: string;
  longAdvice?: string;
  isSharing: boolean;
  onShare: (platform: string) => void;
  onSaveAndViewHistory: () => void;
  onFinish: () => void;
}

export default function FortuneResultDisplay({ 
  fortuneMessage, 
  longAdvice,
  isSharing, 
  onShare, 
  onSaveAndViewHistory, 
  onFinish 
}: FortuneResultDisplayProps) {
  const [aiFeedOpen, setAiFeedOpen] = useState(false);
  return (
    <Card className="p-10 md:p-12 lg:p-14 bg-gradient-to-br from-white to-amber-50 shadow-xl animate-fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-5xl md:text-6xl lg:text-7xl mb-5">🥠</div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3">당신의 운세</h2>
        <div className="w-20 h-1.5 md:w-28 md:h-2 bg-gradient-to-r from-amber-400 to-orange-400 mx-auto rounded-full"></div>
      </div>

      {/* 운세 종이(메시지) 영역 */}
      <div className="relative bg-white p-6 md:p-8 lg:p-10 rounded-xl shadow-inner mb-6">
        <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-700 font-medium">
          "{fortuneMessage}"
        </p>
        {/* AI 피드 트리거: 오른쪽 하단 */}
        <div
          className="absolute bottom-3 right-4 flex items-center gap-1 cursor-pointer select-none text-amber-500 hover:text-amber-700 text-sm md:text-base"
          onClick={() => setAiFeedOpen(true)}
          title="AI 피드 보기"
        >
          <span className="text-lg">💡</span>
          <span>AI 피드</span>
        </div>
  <AiFeedModal open={aiFeedOpen} onClose={() => setAiFeedOpen(false)} message={longAdvice || fortuneMessage} />
      </div>

      <div className="text-sm md:text-base lg:text-lg text-gray-500 mb-6">
        {new Date().toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })}
      </div>

      {/* 공유 및 액션 버튼들 */}
      <div className="space-y-5">
        <ShareButtons isSharing={isSharing} onShare={onShare} />
        <ActionButtons 
          onSaveAndViewHistory={onSaveAndViewHistory} 
          onFinish={onFinish} 
        />
      </div>
    </Card>
  );
}