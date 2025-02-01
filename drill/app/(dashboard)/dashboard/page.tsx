'use client';

import { MachineList } from '@/features/machines/components/machine-list';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Makine Takip Sistemi</h1>
        <p className="text-gray-600">Tüm makinelerin durumunu ve konumunu takip edin</p>
      </div>

      <MachineList />
    </div>
  );
} 