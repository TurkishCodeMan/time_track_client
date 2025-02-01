import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  is_active: boolean;
}

export function useUsers(role?: string) {
  const { getToken } = useAuth();

  const {
    data: users,
    isLoading,
    error,
    refetch
  } = useQuery<User[]>({
    queryKey: ['users', role],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      const response = await api.get('/users/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: role ? { role } : undefined
      });

      return response.data;
    },
  });

  const getWorkerName = (workerId: number) => {
    const worker = users?.find(user => user.id === workerId);
    if (!worker) return 'Bilinmeyen Çalışan';
    return `${worker.name} ${worker.surname}`;
  };

  const getWorkerRole = (workerId: number) => {
    const worker = users?.find(user => user.id === workerId);
    if (!worker) return 'Bilinmeyen Rol';
    
    switch (worker.role) {
      case 'WORKER':
        return 'İşçi';
      case 'ENGINEER':
        return 'Mühendis';
      case 'MANAGER':
        return 'Yönetici';
      default:
        return worker.role;
    }
  };

  return {
    data: users || [],
    isLoading,
    error,
    refetch,
    getWorkerName,
    getWorkerRole
  };
} 