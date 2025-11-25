interface MessageInputProps {
  message: string;
  onMessageChange: (message: string) => void;
}

export default function MessageInput({ message, onMessageChange }: MessageInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        자세한 의견 <span className="text-red-500">*</span>
      </label>
      <textarea
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="운세쿠키에 대한 솔직한 의견을 들려주세요..."
        rows={5}
        required
        maxLength={500}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-none text-sm"
      />
      <p className="text-xs text-gray-500 mt-1">
        {message.length}/500자
      </p>
    </div>
  );
}