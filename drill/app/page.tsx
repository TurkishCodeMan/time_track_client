'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import dynamic from 'next/dynamic';

const MachineMapWithNoSSR = dynamic(
  () => import('@/features/location/components/machine-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[calc(100vh-4rem)] min-h-[600px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-500">Harita yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }
);

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="container min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Hoş Geldiniz</h1>
      <MachineMapWithNoSSR />
    </div>
  );
}
