'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';

export function MobileUserInfo() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="md:hidden bg-white border-b px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {user.name} {user.surname}
        </div>
        <div className="text-xs text-gray-500">
          {user.role}
        </div>
      </div>
    </div>
  );
} 