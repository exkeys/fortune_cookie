import React from 'react';
import Card from '../../../components/base/Card';

interface MarketingTabProps {
  users: any[];
  stats: any;
}

const MarketingTab: React.FC<MarketingTabProps> = ({ users, stats }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <i className="ri-megaphone-line mr-2 text-orange-500"></i>
          마케팅 대시보드
        </h2>
        {/* 마케팅 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {users.length > 0 ? ((users.filter(u => u.status === 'active').length / users.length) * 100).toFixed(1) : '0'}%
                </div>
                <div className="text-sm opacity-90">활성 사용자율</div>
              </div>
              <i className="ri-user-heart-line text-3xl opacity-80"></i>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {users.length > 0 ? (stats.totalFortunes / users.length).toFixed(1) : '0'}
                </div>
                <div className="text-sm opacity-90">1인당 운세 생성</div>
              </div>
              <i className="ri-star-smile-line text-3xl opacity-80"></i>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm opacity-90">공유 수</div>
              </div>
              <i className="ri-share-line text-3xl opacity-80"></i>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm opacity-90">피드백 수</div>
              </div>
              <i className="ri-feedback-line text-3xl opacity-80"></i>
            </div>
          </Card>
        </div>
        {/* 기타 마케팅 내용은 추후 추가 */}
      </Card>
    </div>
  );
};

export default MarketingTab;
