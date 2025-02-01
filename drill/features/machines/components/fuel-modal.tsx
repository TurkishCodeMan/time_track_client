'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLocationHistory } from '@/features/location/hooks/useLocationHistory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FuelModalProps {
  machineId: number;
  isOpen: boolean;
  onClose: () => void;
  activeShiftId?: number;
}

export function FuelModal({ machineId, isOpen, onClose, activeShiftId }: FuelModalProps) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { data: locations = [] } = useLocationHistory(machineId);
  
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      await api.post(`/machines/${machineId}/fuel/`, {
        machine: machineId,
        shift: activeShiftId,
        amount: Number(amount),
        location: selectedLocation ? Number(selectedLocation) : null,
        notes,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      toast({
        title: "Başarılı",
        description: "Mazot tüketimi kaydedildi",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.response?.data?.error || "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mazot Tüketimi Ekle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Miktar (Lt)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Lokasyon</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
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

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Varsa eklemek istediğiniz notları yazın..."
              className="h-20"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit">
              Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 