import { memo } from 'react';
import Card from '../../../components/base/Card';

interface StatisticsCardsProps {
  totalCount: number;
  uniqueRolesCount: number;
  recentWeekCount: number;
  weeklyAverage: number;
}

function StatisticsCards({ 
  totalCount, 
  uniqueRolesCount, 
  recentWeekCount, 
  weeklyAverage 
}: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
      <Card className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
        <div className="text-lg lg:text-xl xl:text-2xl font-bold">{totalCount}</div>
        <div className="text-xs lg:text-sm xl:text-base opacity-90 mt-1">총 운세</div>
      </Card>
      <Card className="p-2 lg:p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center">
        <div className="text-lg lg:text-xl xl:text-2xl font-bold">{uniqueRolesCount}</div>
        <div className="text-xs lg:text-sm xl:text-base opacity-90 mt-1">상담 역할</div>
      </Card>
      <Card className="p-2 lg:p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-center">
        <div className="text-lg lg:text-xl xl:text-2xl font-bold">{recentWeekCount}</div>
        <div className="text-xs lg:text-sm xl:text-base opacity-90 mt-1">최근 7일</div>
      </Card>
      <Card className="p-2 lg:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center">
        <div className="text-lg lg:text-xl xl:text-2xl font-bold">{weeklyAverage}</div>
        <div className="text-xs lg:text-sm xl:text-base opacity-90 mt-1">주 평균</div>
      </Card>
    </div>
  );
}

export default memo(StatisticsCards);