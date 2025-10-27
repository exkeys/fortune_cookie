interface ShareButtonsProps {
  isSharing: boolean;
  onShare: (platform: string) => void;
}

export default function ShareButtons({ isSharing, onShare }: ShareButtonsProps) {
  return (
    <div className="flex justify-center space-x-2 flex-wrap gap-2">
      <button
        onClick={() => onShare('kakao')}
        disabled={isSharing}
        className="flex items-center space-x-2 px-4 py-2 md:px-5 md:py-3 bg-yellow-400 text-yellow-900 rounded-full hover:bg-yellow-500 transition-colors duration-300 shadow-md text-xs md:text-sm lg:text-base font-medium"
      >
        <i className="ri-kakao-talk-fill text-sm md:text-base"></i>
        <span>카카오톡</span>
      </button>
      
      <button
        onClick={() => onShare('instagram')}
        disabled={isSharing}
        className="flex items-center space-x-2 px-4 py-2 md:px-5 md:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors duration-300 shadow-md text-xs md:text-sm lg:text-base font-medium"
      >
        <i className="ri-instagram-fill text-sm md:text-base"></i>
        <span>인스타그램</span>
      </button>
      
      <button
        onClick={() => onShare('twitter')}
        disabled={isSharing}
        className="flex items-center space-x-2 px-4 py-2 md:px-5 md:py-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors duration-300 shadow-md text-xs md:text-sm lg:text-base font-medium"
      >
        <i className="ri-twitter-fill text-sm md:text-base"></i>
        <span>트위터</span>
      </button>
      
      <button
        onClick={() => onShare('facebook')}
        disabled={isSharing}
        className="flex items-center space-x-2 px-4 py-2 md:px-5 md:py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-md text-xs md:text-sm lg:text-base font-medium"
      >
        <i className="ri-facebook-fill text-sm md:text-base"></i>
        <span>페이스북</span>
      </button>
      
      <button
        onClick={() => onShare('copy')}
        disabled={isSharing}
        className="flex items-center space-x-2 px-5 py-3 md:px-6 md:py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors duration-300 shadow-md text-sm md:text-base lg:text-lg font-medium"
      >
        <i className="ri-clipboard-line text-base md:text-lg"></i>
        <span>복사</span>
      </button>
    </div>
  );
}