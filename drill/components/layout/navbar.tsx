'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold">
              TimeTrack
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm hover:text-primary">
                Dashboard
              </Link>
              {(user?.role === 'ADMIN' || user?.role === 'ENGINEER') && (
                <>
                  <Link href="/workers" className="text-sm hover:text-primary">
                    Çalışanlar
                  </Link>
                  <Link href="/assignments" className="text-sm hover:text-primary">
                    Atamalar
                  </Link>
                  <Link href="/machines" className="text-sm hover:text-primary">
                    Makineler
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              {user?.name} {user?.surname} ({user?.role})
            </div>
            <Button variant="outline" onClick={() => logout()}>
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
} 