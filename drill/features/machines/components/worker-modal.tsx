import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId?: number;
  onWorkerAdd: (worker: { name: string; role: string }) => void;
}

const WORKER_ROLES = [
  { id: 'operator', label: 'Operatör' },
  { id: 'helper', label: 'Yardımcı' },
  { id: 'technician', label: 'Teknisyen' },
  { id: 'supervisor', label: 'Supervisor' },
];

export function WorkerModal({ isOpen, onClose, shiftId, onWorkerAdd }: WorkerModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onWorkerAdd({
      name: name.trim(),
      role: role || 'worker'
    });

    // Formu temizle
    setName('');
    setRole('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Çalışan Ekle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">İsim</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Çalışanın adı"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                {WORKER_ROLES.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit">
              Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 