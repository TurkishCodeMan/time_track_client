import dynamic from 'next/dynamic';

// Client component'i dynamic import ile yükle
const LoginClient = dynamic(() => import('../../../features/auth/components/login-page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Yükleniyor...</div>
    </div>
  ),
});

export default function LoginPage() {
  return <LoginClient />;
} 