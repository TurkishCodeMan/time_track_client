'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// Map bileşenini client-side olarak import et
const Map = dynamic(() => import('./map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      Harita yükleniyor...
    </div>
  ),
});

interface LocationFormProps {
  machineId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function LocationForm({ machineId, isOpen, onClose }: LocationFormProps) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPosition) {
      toast({
        title: "Hata",
        description: "Lütfen haritadan bir konum seçin",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      await api.post(`/machines/${machineId}/locations/history/`, {
        latitude: selectedPosition[0],
        longitude: selectedPosition[1],
        timestamp: new Date().toISOString()
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      queryClient.invalidateQueries({ queryKey: ['locationHistory', machineId] });
      
      toast({
        title: "Başarılı",
        description: "Lokasyon bilgileri güncellendi",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Lokasyon Seç</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="h-[400px] w-full relative bg-gray-50 rounded-lg overflow-hidden">
            <Map selectedPosition={selectedPosition} onPositionSelect={handleMapClick} />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedPosition}
            >
              Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 