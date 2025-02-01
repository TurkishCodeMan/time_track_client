import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface WorkerAssignment {
  id: number;
  worker: number;
  machine: number;
  assigned_by: number;
  assigned_at: string;
  ended_at: string | null;
  is_active: boolean;
}

export function useWorkerAssignments() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<WorkerAssignment[]>({
    queryKey: ['worker-assignments'],
    queryFn: async () => {
      const response = await api.get('/worker-machines/', {
        params: { is_active: true }
      });
      return response.data;
    }
  });

  const assignWorker = useMutation({
    mutationFn: async ({ machineId, workerId }: { machineId: number; workerId: number }) => {
      const response = await api.post(`/machines/${machineId}/assign_worker/`, {
        worker_id: workerId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments'] });
    }
  });

  const unassignWorker = useMutation({
    mutationFn: async ({ machineId, workerId }: { machineId: number; workerId: number }) => {
      const response = await api.post(`/machines/${machineId}/unassign_worker/`, {
        worker_id: workerId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments'] });
    }
  });

  return {
    data: data || [],
    isLoading,
    error,
    assignWorker: assignWorker.mutate,
    unassignWorker: unassignWorker.mutate
  };
} 