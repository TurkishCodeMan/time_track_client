import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface Machine {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  status:string
}

export function useMachines() {
  const { getToken } = useAuth();

  return useQuery<Machine[], Error>({
    queryKey: ['machines'],
    queryFn: async () => {
      try {
        const token = await getToken();
        
        if (!token) {
          throw new Error('Yetkilendirme token\'ı bulunamadı');
        }

        const response = await api.get('/machines/', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.data) {
          throw new Error('Makine verisi alınamadı');
        }

        return response.data;
      } catch (error) {
        console.error('Makine verisi alınırken hata:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    gcTime: 1000 * 60 * 5, // 5 dakika
    staleTime: 30000 // 30 saniye
  });
} 