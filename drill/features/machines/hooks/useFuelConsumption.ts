import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface FuelConsumptionResponse {
  total_consumption: number;
  history: FuelConsumption[];
}

interface FuelConsumption {
  id: number;
  machine: number;
  shift: number | null;
  amount: number;
  location: number | null;
  timestamp: string;
  notes: string;
  created_at: string;
}

interface CreateFuelConsumptionParams {
  machineId: number;
  amount: number;
  shiftId?: number;
  locationId?: number;
  notes?: string;
}

export function useFuelConsumption(machineId: number) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const fuelConsumptions = useQuery({
    queryKey: ['fuelConsumptions', machineId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      const { data } = await api.get<FuelConsumptionResponse>(`/machines/${machineId}/fuel/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data;
    },
    enabled: !!machineId,
  });

  const createFuelConsumption = useMutation({
    mutationFn: async ({ machineId, amount, shiftId, locationId, notes }: CreateFuelConsumptionParams) => {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      const { data } = await api.post<FuelConsumption>(`/machines/${machineId}/fuel/`, {
        amount,
        shift: shiftId,
        location: locationId,
        notes,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelConsumptions', machineId] });
    },
  });

  const deleteFuelConsumption = useMutation({
    mutationFn: async (consumptionId: number) => {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      await api.delete(`/machines/${machineId}/fuel/${consumptionId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelConsumptions', machineId] });
    },
  });

  return {
    fuelConsumptions,
    createFuelConsumption,
    deleteFuelConsumption
  };
} 