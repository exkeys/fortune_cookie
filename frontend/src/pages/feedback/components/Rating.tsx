interface RatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

export default function Rating({ rating, onRatingChange }: RatingProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        전체적인 만족도
      </label>
      <div className="flex justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`w-10 h-10 rounded-full transition-all duration-300 ${
              star <= rating
                ? 'text-amber-400 hover:text-amber-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <i className="ri-star-fill text-2xl"></i>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-gray-500 mt-2">
        {rating}점 / 5점
      </p>
    </div>
  );
}