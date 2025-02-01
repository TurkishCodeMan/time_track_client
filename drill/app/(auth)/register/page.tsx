
import dynamic from 'next/dynamic';

// Client component'i dynamic import ile yükle
const RegisterClient = dynamic(() => import('../../../features/auth/components/register-page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Yükleniyor...</div>
    </div>
  ),
});

export default function RegisterPage() {
  return <RegisterClient />;
} 