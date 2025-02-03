'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { WorkerModal } from '@/features/workers/components/worker-modal';
import { useWorkers } from '@/features/workers/hooks/useWorkers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function WorkersPage() {
  const { user } = useAuth();
  const { workers, isLoading, deleteWorker } = useWorkers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  const canManageWorkers = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  const handleEdit = (worker: any) => {
    setSelectedWorker(worker);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu çalışanı silmek istediğinize emin misiniz?')) {
      await deleteWorker(id);
    }
  };

  const handleAddNew = () => {
    setSelectedWorker(null);
    setIsModalOpen(true);
  };

  if (!canManageWorkers) {
    return (
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Yetkisiz Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Çalışanlar</CardTitle>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Çalışan
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Yükleniyor...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>{worker.name} {worker.surname}</TableCell>
                    <TableCell>{worker.email}</TableCell>
                    <TableCell>{worker.role}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(worker)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(worker.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        worker={selectedWorker}
      />
    </div>
  );
} 