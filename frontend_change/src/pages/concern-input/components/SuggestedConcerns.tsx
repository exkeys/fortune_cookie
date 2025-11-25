import Card from '../../../components/base/Card';

interface SuggestedConcernsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestedConcerns = [
  "오늘 중요한 결정을 내려야 하는데 고민이에요",
  "새로운 도전을 시작하려고 하는데 용기가 필요해요",
  "인간관계에서 어려움을 겪고 있어요",
  "미래에 대한 불안감이 있어요",
  "일과 삶의 균형을 찾고 싶어요",
  "자신감이 부족해서 망설이고 있어요",
  "내 선택이 옳은지 확신이 서지 않아요",
  "계속 노력해도 성과가 없을까 봐 두려워요"
];

export default function SuggestedConcerns({ onSuggestionClick }: SuggestedConcernsProps) {
  return (
    <Card className="p-2 md:p-2 lg:p-3 mb-4 max-w-4xl mx-auto">
      <h3 className="text-xs md:text-sm lg:text-base font-bold text-gray-800 mb-1 flex items-center">
        <i className="ri-lightbulb-line text-amber-500 mr-1 text-sm md:text-base lg:text-lg"></i>
        이런 고민은 어떠세요?
      </h3>
      <div className="space-y-1">
        {suggestedConcerns.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left p-2 md:p-3 lg:p-4 rounded-lg bg-gray-50 hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all duration-300 text-xs md:text-sm lg:text-base text-gray-700"
          >
            "{suggestion}"
          </button>
        ))}
      </div>
    </Card>
  );
}