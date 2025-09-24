interface EmailInputProps {
  email: string;
  onEmailChange: (email: string) => void;
}

export default function EmailInput({ email, onEmailChange }: EmailInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        이메일 (선택사항)
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="답변이 필요한 경우 이메일을 입력해주세요"
        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent text-sm"
      />
    </div>
  );
}