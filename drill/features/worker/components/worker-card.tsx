'use client';

import { LegacyRef } from 'react';
import { User, X } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { Button } from '@/components/ui/button';

interface WorkerCardProps {
  worker: {
    id: number;
    name: string;
    surname: string;
    role?: string;
  };
  onUnassign?: () => void;
  showUnassign?: boolean;
}

export function WorkerCard({ worker, onUnassign, showUnassign }: WorkerCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'worker',
    item: { id: worker.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as unknown as LegacyRef<HTMLDivElement>}
      className={`flex items-center justify-between p-3 rounded-lg ${
        isDragging ? 'opacity-50' : ''
      } bg-yellow-50 border border-yellow-200 cursor-move hover:bg-yellow-100 transition-colors`}
    >
      <div className="flex items-center">
        <User className="w-5 h-5 text-yellow-500 mr-2" />
        <span className="text-sm font-medium">{worker.name} {worker.surname}</span>
      </div>
      {showUnassign && onUnassign && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onUnassign();
          }}
          className="h-8 w-8 text-gray-500 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 