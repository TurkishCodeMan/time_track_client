'use client';

import { Wrench } from 'lucide-react';
import { LegacyRef } from 'react';
import { useDrag } from 'react-dnd';

interface EngineerCardProps {
  engineer: {
    id: number;
    name: string;
    surname: string;
  };
}

export function EngineerCard({ engineer }: EngineerCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'worker',
    item: { workerId: engineer.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
    ref={drag as unknown as LegacyRef<HTMLDivElement>}
      className={`flex items-center p-3 rounded-lg ${
        isDragging ? 'opacity-50' : ''
      } bg-blue-50 border border-blue-200 cursor-move transition-opacity`}
    >
      <Wrench className="w-5 h-5 text-blue-500 mr-2" />
      <span className="text-sm font-medium">{engineer.name} {engineer.surname}</span>
    </div>
  );
} 