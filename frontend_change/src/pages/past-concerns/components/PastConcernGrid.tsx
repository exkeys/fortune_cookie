import { memo } from 'react';
import PastConcernCard from './PastConcernCard';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface HistoryItem {
  id: string;
  date: string;
  created_at: string;
  updated_at?: string | null;
  role?: Role;
  concern?: string;
  fortune: string;
  aiFeed?: string;
}

interface PastConcernGridProps {
  items: HistoryItem[];
  startIndex: number;
  viewMode: 'grid' | 'list';
  formatDate: (dateString: string) => string;
  onItemClick: (item: HistoryItem) => void;
  onShareClick: (item: HistoryItem, e: React.MouseEvent) => void;
  onDeleteClick: (id: string, e: React.MouseEvent) => void;
}

function PastConcernGrid({
  items,
  startIndex,
  viewMode,
  formatDate,
  onItemClick,
  onShareClick,
  onDeleteClick
}: PastConcernGridProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 xl:gap-5">
        {items.map((item, index) => (
          <PastConcernCard
            key={item.id}
            item={item}
            index={index}
            startIndex={startIndex}
            viewMode="grid"
            formatDate={formatDate}
            onItemClick={onItemClick}
            onShareClick={onShareClick}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:space-y-3 xl:space-y-4">
      {items.map((item, index) => (
        <PastConcernCard
          key={item.id}
          item={item}
          index={index}
          startIndex={startIndex}
          viewMode="list"
          formatDate={formatDate}
          onItemClick={onItemClick}
          onShareClick={onShareClick}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  );
}

export default memo(PastConcernGrid);