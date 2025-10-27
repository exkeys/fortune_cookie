interface FeedbackTypeProps {
  feedbackType: string;
  onTypeChange: (type: string) => void;
}

export default function FeedbackType({ feedbackType, onTypeChange }: FeedbackTypeProps) {
  const types = [
    { value: 'suggestion', label: '개선 제안', icon: 'ri-lightbulb-line' },
    { value: 'bug', label: '버그 신고', icon: 'ri-bug-line' },
    { value: 'compliment', label: '칭찬', icon: 'ri-heart-line' },
    { value: 'other', label: '기타', icon: 'ri-chat-1-line' }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        피드백 유형
      </label>
      <div className="grid grid-cols-2 gap-3">
        {types.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onTypeChange(type.value)}
            className={`p-3 rounded-lg border transition-all duration-300 flex items-center space-x-2 ${
              feedbackType === type.value
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <i className={`${type.icon} w-5 h-5 flex items-center justify-center`}></i>
            <span className="text-sm font-medium">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}