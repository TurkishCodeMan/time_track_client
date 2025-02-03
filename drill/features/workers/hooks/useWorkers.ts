import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Worker {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER' | 'WORKER';
}

interface WorkerInput {
  name: string;
  surname: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER' | 'WORKER';
  password?: string;
}

export function useWorkers() {
  const queryClient = useQueryClient();

  const { data: workers = [], isLoading, error } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: () => api.get('/users/').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newWorker: WorkerInput) =>
      api.post('/users/', newWorker).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: WorkerInput & { id: number }) =>
      api.put(`/users/${id}/`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/users/${id}/`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  return {
    workers,
    isLoading,
    error,
    createWorker: createMutation.mutateAsync,
    updateWorker: updateMutation.mutateAsync,
    deleteWorker: deleteMutation.mutateAsync,
  };
} 