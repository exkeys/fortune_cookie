import Card from '../../../components/base/Card';

interface CustomRoleInputProps {
  customRole: string;
  onCustomRoleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CustomRoleInput({ customRole, onCustomRoleChange }: CustomRoleInputProps) {
  return (
    <Card className="p-6 md:p-8 lg:p-10 mb-8 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 max-w-3xl mx-auto">
      <div className="text-center mb-5">
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-2">어떤 역할인가요?</h3>
        <p className="text-sm md:text-base lg:text-lg text-gray-600">예: 요리사, 간호사, 작가, 운동선수 등</p>
      </div>
      <div className="max-w-lg mx-auto">
        <input
          type="text"
          value={customRole}
          onChange={onCustomRoleChange}
          placeholder="역할을 입력해주세요"
          className="w-full p-3 md:p-4 lg:p-5 text-base md:text-lg lg:text-xl border-2 border-gray-200 rounded-xl focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all duration-300 text-gray-800 placeholder-gray-400 text-center"
          maxLength={20}
          autoFocus
        />
        <div className="text-right mt-2 text-xs md:text-sm lg:text-base text-gray-400">
          {customRole.length}/20
        </div>
      </div>
    </Card>
  );
}