'use client';

import dynamic from 'next/dynamic';

const RegisterClient = dynamic(() => import('./register-page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Yükleniyor...</div>
    </div>
  ),
});

export default function RegisterClientWrapper() {
  return <RegisterClient />;
} 