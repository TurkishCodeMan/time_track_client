'use client';

import { useEffect } from 'react';
import { useMachines } from '../hooks/useMachines';
import { useWorkerAssignments, type WorkerAssignment } from '../hooks/useWorkerAssignments';
import { useUsers } from '@/features/user/hooks/useUsers';
import { MachineCard } from './machine-card';
import { useToast } from '@/components/ui/use-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface Machine {
  id: number;
  name: string;
  description?: string;
  status: string;
  is_active: boolean;
}

interface Worker {
  id: number;
  name: string;
  surname: string;
  role: 'WORKER' | 'ENGINEER';
}

export function MachineList() {
  const { data: machines = [], isLoading, error, refetch } = useMachines();
  const { data: assignments = [], assignWorker, unassignWorker } = useWorkerAssignments();
  const { data: users = [] } = useUsers();
  const { toast } = useToast();

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div>Hata: {error.message}</div>;
  }

  // Her makine için atanmış çalışanları bul
  const getMachineWorkers = (machineId: number): Worker[] => {
    const machineAssignments = assignments.filter(
      (a: WorkerAssignment) => a.machine === machineId && a.is_active
    );
    return machineAssignments
      .map((assignment: WorkerAssignment) => {
        const worker = users.find(u => u.id === assignment.worker);
        if (!worker) return null;
        return {
          id: worker.id,
          name: worker.name,
          surname: worker.surname,
          role: worker.role as 'WORKER' | 'ENGINEER'
        };
      })
      .filter((worker): worker is Worker => worker !== null);
  };

  const handleWorkerAssign = async (machineId: number, workerId: number) => {
    try {
      await assignWorker({ machineId, workerId });
      toast({
        title: "Başarılı",
        description: "Çalışan başarıyla atandı.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çalışan atanırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleWorkerUnassign = async (machineId: number, workerId: number) => {
    try {
      await unassignWorker({ machineId, workerId });
      toast({
        title: "Başarılı",
        description: "Çalışan ataması kaldırıldı.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çalışan ataması kaldırılırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((machine: Machine) => (
          <MachineCard
            key={machine.id}
            machine={machine}
            assignedWorkers={getMachineWorkers(machine.id)}
            onWorkerAssign={(workerId) => handleWorkerAssign(machine.id, workerId)}
            onWorkerUnassign={(workerId) => handleWorkerUnassign(machine.id, workerId)}
            onRefresh={refetch}
          />
        ))}
      </div>
    </DndProvider>
  );
} 