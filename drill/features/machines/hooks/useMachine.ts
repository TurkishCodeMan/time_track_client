import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface Machine {
  id: number;
  name: string;
  description?: string;
  status: 'DRILLING' | 'MOVING' | 'MAINTENANCE' | 'IDLE' | 'SETUP';
  is_active: boolean;
}

export function useMachine(machineId: number) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['machine', machineId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      const { data } = await api.get<Machine>(`/machines/${machineId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data;
    },
    enabled: !!machineId,
  });
} 