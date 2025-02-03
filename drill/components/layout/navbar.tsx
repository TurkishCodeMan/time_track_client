'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LayoutDashboard, Users, ClipboardList, Wrench, Package2, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: '/workers',
      label: 'Çalışanlar',
      icon: Users,
      show: user?.role === 'ADMIN' || user?.role === 'ENGINEER',
    },
    {
      href: '/machines',
      label: 'Makineler',
      icon: Wrench,
      show: user?.role === 'ADMIN' || user?.role === 'ENGINEER',
    },
    {
      href: '/inventory',
      label: 'Stok Takip',
      icon: Package2,
      show: user?.role === 'ADMIN' || user?.role === 'ENGINEER',
    },
  ];

  return (
    <>
      {/* Üst Menü - Desktop */}
      <nav className="border-b hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold">
                TimeTrack
              </Link>
              <div className="flex items-center gap-4">
                {menuItems.map((item) =>
                  item.show ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm hover:text-primary flex items-center gap-2 ${
                        isActive(item.href) ? 'text-primary font-medium' : ''
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ) : null
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm">
                {user?.name} {user?.surname} ({user?.role})
              </div>
              <Button variant="outline" onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Alt Menü - Mobil */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
        <div className="flex justify-around py-2">
          {menuItems.map((item) =>
            item.show ? (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 ${
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-primary'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ) : null
          )}
          <button
            onClick={() => logout()}
            className="flex flex-col items-center p-2 text-gray-500 hover:text-primary"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-xs mt-1">Çıkış</span>
          </button>
        </div>
      </div>

      {/* Mobil için alt padding */}
      <div className="h-0 md:hidden" />
    </>
  );
} 