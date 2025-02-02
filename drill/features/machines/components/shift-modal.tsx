'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUsers } from '@/features/user/hooks/useUsers';
import { useLocationHistory } from '@/features/location/hooks/useLocationHistory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useShifts } from '../hooks/useShifts';

interface ShiftModalProps {
  machineId: number;
  isOpen: boolean;
  onClose: () => void;
  activeShift?: any;
}

export function ShiftModal({ machineId, isOpen, onClose, activeShift }: ShiftModalProps) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { data: users = [] } = useUsers();
  const { data: locations = [] } = useLocationHistory(machineId);
  const { createShift, endShift } = useShifts(machineId);
  
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [drillingDepth, setDrillingDepth] = useState<string>('');
  const [fuelConsumption, setFuelConsumption] = useState<string>('');
  const [startLocation, setStartLocation] = useState<string>('');
  const [endLocation, setEndLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeShift) {
        // Vardiya sonlandırma
        await endShift(activeShift.id, {
          end_time: new Date().toISOString(),
          drilling_depth: Number(drillingDepth) || 0,
          fuel_consumption: Number(fuelConsumption) || 0,
          end_location: endLocation ? Number(endLocation) : null
        });

        toast({
          title: "Başarılı",
          description: "Vardiya başarıyla sonlandırıldı",
        });
      } else {
        // Yeni vardiya başlatma
        await createShift({
          start_time: new Date().toISOString(),
          drilling_depth: 0,
          fuel_consumption: 0,
          workers: selectedWorkers,
          start_location: startLocation ? Number(startLocation) : null
        });

        toast({
          title: "Başarılı",
          description: "Yeni vardiya başlatıldı",
        });
      }

      onClose();
      setDrillingDepth('');
      setFuelConsumption('');
      setSelectedWorkers([]);
      setStartLocation('');
      setEndLocation('');
    } catch (error: any) {
      console.error('Vardiya işlemi hatası:', error);
      toast({
        title: "Hata",
        description: error.response?.data?.error || "Vardiya işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {activeShift ? 'Vardiyayı Sonlandır' : 'Yeni Vardiya Başlat'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!activeShift && (
            <>
              <div className="space-y-4">
                <Label>Çalışanlar</Label>
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  {users
                    .filter(user => user.role === 'WORKER' || user.role === 'ENGINEER')
                    .map(user => (
                      <div key={user.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={`worker-${user.id}`}
                          checked={selectedWorkers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedWorkers(prev => [...prev, user.id]);
                            } else {
                              setSelectedWorkers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`worker-${user.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {user.name} {user.surname} ({user.role === 'ENGINEER' ? 'Mühendis' : 'İşçi'})
                        </label>
                      </div>
                    ))}
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Başlangıç Lokasyonu</Label>
                <Select value={startLocation} onValueChange={setStartLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lokasyon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {new Date(location.timestamp).toLocaleString()} - 
                        ({location.latitude}, {location.longitude})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {activeShift && (
            <>
              <div className="space-y-2">
                <Label htmlFor="drillingDepth">Delgi Miktarı (m)</Label>
                <Input
                  id="drillingDepth"
                  type="number"
                  step="0.01"
                  value={drillingDepth}
                  onChange={(e) => setDrillingDepth(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelConsumption">Mazot Tüketimi (Lt)</Label>
                <Input
                  id="fuelConsumption"
                  type="number"
                  step="0.01"
                  value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Bitiş Lokasyonu</Label>
                <Select value={endLocation} onValueChange={setEndLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lokasyon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {new Date(location.timestamp).toLocaleString()} - 
                        ({location.latitude}, {location.longitude})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={`${activeShift ? 'bg-warning hover:bg-warning-hover' : 'bg-success hover:bg-success-hover'} text-white`}
            >
              {isSubmitting ? 'İşleniyor...' : activeShift ? 'Sonlandır' : 'Başlat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 