'use client';

import { Construction, MapPin } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { WorkerCard } from '@/features/worker/components/worker-card';
import { LegacyRef, Suspense, lazy } from 'react';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { useRouter } from 'next/navigation';

const Dialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), {
  ssr: false
});

const DialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), {
  ssr: false
});

const DialogTrigger = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTrigger), {
  ssr: false
});

const DialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), {
  ssr: false
});

interface Worker {
  id: number;
  name: string;
  surname: string;
  role: 'WORKER' | 'ENGINEER';
}

interface MachineCardProps {
  machine: {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    status: string;
  };
  assignedWorkers: Worker[];
  onWorkerAssign: (workerId: number) => void;
  onWorkerUnassign: (workerId: number) => void;
  onRefresh?: () => void;
}

// Statü renkleri ve etiketleri
const STATUS_COLORS : Record<string, string> = {
  DRILLING: 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200',
  MOVING: 'bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200',
  MAINTENANCE: 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200',
  IDLE: 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200',
  SETUP: 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
};

const STATUS_LABELS :any = {
  DRILLING: 'Sondaj',
  MOVING: 'Nakliye',
  MAINTENANCE: 'Bakım',
  IDLE: 'Boşta',
  SETUP: 'Kurulum'
};

export function MachineCard({ 
  machine, 
  assignedWorkers,
  onWorkerAssign,
  onWorkerUnassign,
  onRefresh
}: MachineCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const canUpdateLocation = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  const handleCardClick = () => {
    router.push(`/machines/${machine.id}`);
  };

  const handleLocationUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Event propagation'ı durdur

    if (!canUpdateLocation) {
      toast({
        title: "Yetki Hatası",
        description: "Bu işlem için yetkiniz bulunmamaktadır.",
        variant: "destructive"
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Hata",
        description: "Tarayıcınız konum özelliğini desteklemiyor.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUpdating(true);

      // Konum izni iste
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        toast({
          title: "Konum İzni Gerekli",
          description: "Konum güncellemesi için tarayıcı ayarlarından konum iznini etkinleştirmeniz gerekiyor.",
          variant: "destructive"
        });
        return;
      }

      if (permission.state === 'prompt') {
        toast({
          title: "Konum İzni",
          description: "Konum güncellemesi için konum izni vermeniz gerekiyor.",
        });
      }

      // Konum al
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      // Konumu güncelle
      const response = await api.post(`/machines/${machine.id}/update_location/`, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading || 0,
        accuracy: position.coords.accuracy || 0,
        timestamp: new Date().toISOString()
      });

      if (response.status === 201) {
        toast({
          title: "Başarılı",
          description: "Konum başarıyla güncellendi.",
        });
        onRefresh?.();
      }
    } catch (error) {
      console.error('Konum güncelleme hatası:', error);
      toast({
        title: "Hata",
        description: "Konum güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'worker',
    drop: (item: { id: number }) => {
      onWorkerAssign(item.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <Card
      ref={drop as unknown as LegacyRef<HTMLDivElement>}
      className={`p-4 space-y-4 cursor-pointer transition-all duration-200 ${
        isOver ? 'border-blue-500 border-2' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{machine.name}</span>
          <Badge variant={machine.status === 'IDLE' ? 'secondary' : 'default'}>
            {machine.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          {machine.description || 'Açıklama bulunmuyor'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assignedWorkers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Atanmış Çalışanlar:</h4>
            <div className="space-y-2">
              {assignedWorkers.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onUnassign={() => onWorkerUnassign(worker.id)}
                  showUnassign
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {canUpdateLocation && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => handleLocationUpdate(e)}
            disabled={isUpdating}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {isUpdating ? 'Güncelleniyor...' : 'Konumu Güncelle'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 