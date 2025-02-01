import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface Worker {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
}

export function useWorkers() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      const { data } = await api.get<Worker[]>('/users/?role=WORKER', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data;
    },
  });
} 