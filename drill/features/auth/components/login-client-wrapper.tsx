'use client';

import dynamic from 'next/dynamic';

const LoginClient = dynamic(() => import('./login-page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Yükleniyor...</div>
    </div>
  ),
});

export default function LoginClientWrapper() {
  return <LoginClient />;
} 