import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface Worker {
  id: number;
  name: string;
  role: string;
  machine: number;
  shift?: number;
}

interface Shift {
  id: number;
  machine: number;
  workers: number[];
  start_time: string;
  end_time: string | null;
  drilling_depth: number;
  fuel_consumption: number;
  created_at: string;
  updated_at: string;
}

interface ShiftsResponse {
  data: Shift[];
}

interface CreateShiftData {
  start_time: string;
  drilling_depth: number;
  fuel_consumption: number;
  workers: number[];
  start_location?: number | null;
}

interface EndShiftData {
  end_time: string;
  drilling_depth: number;
  fuel_consumption: number;
  end_location?: number | null;
}

export function useShifts(machineId: number) {
  const { getToken } = useAuth();

  const {
    data: shifts,
    isLoading,
    error,
    refetch: refetchShifts
  } = useQuery<Shift[], Error, ShiftsResponse>({
    queryKey: ['shifts', machineId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      const response = await api.get(`/machines/${machineId}/shifts/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
    select: (data) => ({
      data: data
    })
  });

  const createShift = async (data: CreateShiftData) => {
    const token = await getToken();
    if (!token) throw new Error('No token available');

    const shiftData = {
      ...data,
      machine: machineId,
      drilling_depth: Number(data.drilling_depth),
      fuel_consumption: Number(data.fuel_consumption)
    };

    await api.post(`/machines/${machineId}/shifts/`, shiftData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return refetchShifts();
  };

  const endShift = async (shiftId: number, data: EndShiftData) => {
    const token = await getToken();
    if (!token) throw new Error('No token available');

    const endShiftData = {
      ...data,
      drilling_depth: Number(data.drilling_depth),
      fuel_consumption: Number(data.fuel_consumption)
    };

    await api.post(`/shifts/${shiftId}/end/`, endShiftData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return refetchShifts();
  };

  const addWorkerToShift = async (shiftId: number, workerId: number) => {
    const token = await getToken();
    if (!token) throw new Error('No token available');

    await api.post(`/shifts/${shiftId}/workers/`, { worker_id: workerId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return refetchShifts();
  };

  const removeWorkerFromShift = async (shiftId: number, workerId: number) => {
    const token = await getToken();
    if (!token) throw new Error('No token available');

    await api.delete(`/shifts/${shiftId}/workers/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { worker_id: workerId },
    });

    return refetchShifts();
  };

  const deleteShift = async (shiftId: number) => {
    const token = await getToken();
    if (!token) throw new Error('No token available');

    await api.delete(`/shifts/${shiftId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return refetchShifts();
  };

  return {
    shifts,
    isLoading,
    error,
    createShift,
    endShift,
    addWorkerToShift,
    removeWorkerFromShift,
    deleteShift,
    refetch: refetchShifts
  };
} 