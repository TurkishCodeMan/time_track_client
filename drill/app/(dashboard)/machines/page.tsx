'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import dynamic from 'next/dynamic';
import { WorkerCard } from '@/features/worker/components/worker-card';
import { EngineerCard } from '@/features/worker/components/engineer-card';
import { MachineCard } from '@/features/machines/components/machine-card';
import { useToast } from '@/components/ui/use-toast';
import { useMachines } from '@/features/machines/hooks/useMachines';
import { useUsers } from '@/features/user/hooks/useUsers';
import { useWorkerAssignments } from '@/features/machines/hooks/useWorkerAssignments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DndProviderWithNoSSR = dynamic(
  () => Promise.resolve(({ children }: { children: React.ReactNode }) => (
    <DndProvider backend={HTML5Backend}>{children}</DndProvider>
  )),
  { ssr: false }
);

const MachineMapWithNoSSR = dynamic(
  () => import('@/features/location/components/machine-map'),
  { ssr: false }
);

interface Worker {
  id: number;
  name: string;
  surname: string;
  role: 'WORKER' | 'ENGINEER';
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

export default function MachineDashboard() {
  const { toast } = useToast();
  
  // Veri çekme hook'ları
  const { data: machines = [], isLoading: isMachinesLoading } = useMachines();
  const { data: workers = [] } = useUsers('WORKER');
  const { data: engineers = [] } = useUsers('ENGINEER');
  const { 
    data: assignments = [], 
    assignWorker, 
    unassignWorker 
  } = useWorkerAssignments();

  // Makineye atanmış worker'ları bul
  const findAssignedWorkers = (machineId: number) => {
    const machineAssignments = assignments.filter(
      a => a.machine === machineId && a.is_active
    );
    return machineAssignments
      .map(assignment => {
        const user = [...workers, ...engineers].find(w => w.id === assignment.worker);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          surname: user.surname,
          role: user.role as 'WORKER' | 'ENGINEER'
        };
      })
      .filter((user): user is Worker => user !== null);
  };

  // Worker atama işlemi
  const handleWorkerAssign = async (machineId: number, workerId: number) => {
    try {
      await assignWorker({ machineId, workerId });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: 'Hata',
        description: apiError.response?.data?.error || 'Worker ataması yapılırken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  // Worker çıkarma işlemi
  const handleWorkerUnassign = async (machineId: number, workerId: number) => {
    try {
      await unassignWorker({ machineId, workerId });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: 'Hata',
        description: apiError.response?.data?.error || 'Worker ataması kaldırılırken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  if (isMachinesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Makine Yönetimi</h1>
      
      <Tabs defaultValue="list" className="mb-8">
        <TabsList>
          <TabsTrigger value="map">Harita Görünümü</TabsTrigger>
          <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="mt-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <MachineMapWithNoSSR />
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          <DndProviderWithNoSSR>
            <div className="grid grid-cols-12 gap-6">
              {/* Worker'lar */}
              <div className="col-span-3 space-y-4">
                <h2 className="text-lg font-semibold mb-3">Workers</h2>
                {workers.map(worker => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))}
              </div>

              {/* Makineler */}
              <div className="col-span-6">
                <h2 className="text-lg font-semibold mb-3">Makineler</h2>
                <div className="grid grid-cols-1 gap-4">
                  {machines.map(machine => (
                    <MachineCard
                      key={machine.id}
                      machine={{...machine, is_active: true, status: machine.status || 'IDLE'}}                      assignedWorkers={findAssignedWorkers(machine.id)}
                      onWorkerAssign={(workerId) => handleWorkerAssign(machine.id, workerId)}
                      onWorkerUnassign={(workerId) => handleWorkerUnassign(machine.id, workerId)}
                    />
                  ))}
                </div>
              </div>

              {/* Mühendisler */}
              <div className="col-span-3 space-y-4">
                <h2 className="text-lg font-semibold mb-3">Mühendisler</h2>
                {engineers.map(engineer => (
                  <EngineerCard key={engineer.id} engineer={engineer} />
                ))}
              </div>
            </div>
          </DndProviderWithNoSSR>
        </TabsContent>
      </Tabs>
    </div>
  );
} 