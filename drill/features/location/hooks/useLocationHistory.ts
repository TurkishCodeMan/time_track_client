import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LocationRecord } from '../types';

export function useLocationHistory(machineId: number) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['locationHistory', machineId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      const { data } = await api.get<LocationRecord[]>(`/machines/${machineId}/locations/history/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data;
    },
    enabled: !!machineId,
  });
} 