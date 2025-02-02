'use client';

import dynamic from 'next/dynamic';

const MachineList = dynamic(() => import('./machine-list'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
      <div className="text-lg">Yükleniyor...</div>
    </div>
  ),
});

export default function DashboardClientWrapper() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Makine Yönetimi</h1>
      <MachineList />
    </div>
  );
} 