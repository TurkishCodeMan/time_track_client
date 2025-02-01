'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMachine } from '@/features/machines/hooks/useMachine';
import { useLocationHistory } from '@/features/location/hooks/useLocationHistory';
import { useShifts } from '@/features/machines/hooks/useShifts';
import { useFuelConsumption } from '@/features/machines/hooks/useFuelConsumption';
import { useUsers } from '@/features/user/hooks/useUsers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShiftModal } from '@/features/machines/components/shift-modal';
import { FuelModal } from '@/features/machines/components/fuel-modal';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { LocationForm } from '@/features/location/components/location-form';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Trash2 } from 'lucide-react';
import { WorkerModal } from '@/features/machines/components/worker-modal';



interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

const Map = dynamic(() => import('@/features/location/components/map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
      Harita yükleniyor...
    </div>
  ),
});

export default function MachineDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const machineId = Number(params.id);

  // Modal durumları
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);

  // Veri çekme hook'ları
  const { data: machine, isLoading: isMachineLoading } = useMachine(machineId);
  const { data: locations = [], refetch } = useLocationHistory(machineId);
  const { shifts, refetch: refetchShifts } = useShifts(machineId);
  const { fuelConsumptions } = useFuelConsumption(machineId);
  const { getWorkerName, getWorkerRole } = useUsers();

  // Toplam metrikleri hesapla
  const totalDrillingDepth = shifts?.data?.reduce((total, shift) => {
    // Sadece tamamlanmış vardiyaları hesaba kat
    if (shift.end_time) {
      return total + (Number(shift.drilling_depth) || 0);
    }
    return total;
  }, 0) || 0;
  const totalFuelConsumption = fuelConsumptions.data?.total_consumption || 0;
  const activeShift = shifts?.data?.find(shift => !shift.end_time);

  const { getToken } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation([Number(lat), Number(lng)]);
    setIsCreatingLocation(true);
  };

  const handleCreateLocation = async () => {
    if (!selectedLocation) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('No token available');

      // Koordinatları 6 haneye yuvarla
      const lat = Number(Number(selectedLocation[0]).toFixed(6));
      const lng = Number(Number(selectedLocation[1]).toFixed(6));

      const data = {
        latitude: lat,
        longitude: lng,
        accuracy: 0,
        heading: 0,
        drilling_depth: 0,
        fuel_consumption: 0
      };

      console.log('Gönderilen veri:', data);

      await api.post(`/machines/${machineId}/locations/history/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await refetch();
      
      toast({
        title: "Başarılı",
        description: "Yeni lokasyon eklendi",
      });
      
      setIsCreatingLocation(false);
      setSelectedLocation(null);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Lokasyon ekleme hatası:', apiError.response?.data || apiError);
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Lokasyon eklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Token bulunamadı');

      await api.delete(`/machines/${machineId}/locations/history/${locationId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await refetch();
      
      toast({
        title: "Başarılı",
        description: "Lokasyon başarıyla silindi",
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Lokasyon silme hatası:', apiError.response?.data || apiError);
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Lokasyon silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleAddWorker = async (worker: { name: string; role: string }) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Token bulunamadı');

      const data = {
        name: worker.name,
        role: worker.role,
        machine: machineId,
        shift: activeShift?.id
      };

      await api.post(`/machines/${machineId}/shifts/${activeShift?.id}/workers/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Vardiyaları yeniden yükle
      await refetchShifts();
      
      toast({
        title: "Başarılı",
        description: "Çalışan başarıyla eklendi",
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Çalışan ekleme hatası:', apiError.response?.data || apiError);
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Çalışan eklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleRemoveWorker = async (workerId: number) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Token bulunamadı');

      await api.delete(`/machines/${machineId}/shifts/${activeShift?.id}/workers/${workerId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Vardiyaları yeniden yükle
      await refetchShifts();
      
      toast({
        title: "Başarılı",
        description: "Çalışan başarıyla silindi",
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Çalışan silme hatası:', apiError.response?.data || apiError);
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Çalışan silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  if (isMachineLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
        <div className="h-[200px] w-full bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-red-800 font-medium">Hata</h2>
          <p className="text-red-600">Makine bilgileri yüklenirken bir hata oluştu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{machine.name}</h1>
          <p className="text-gray-500">{machine.description}</p>
        </div>
        <Badge variant={machine.is_active ? "success" : "secondary"}>
          {machine.is_active ? "Aktif" : "Pasif"}
        </Badge>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Toplam Delgi</h3>
          <p className="text-2xl font-bold">{totalDrillingDepth} m</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Toplam Mazot Tüketimi</h3>
          <p className="text-2xl font-bold">{totalFuelConsumption} Lt</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Aktif Vardiya</h3>
          <p className="text-2xl font-bold">{activeShift ? 'Var' : '-'}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">Lokasyonlar</TabsTrigger>
          <TabsTrigger value="shifts">Vardiyalar</TabsTrigger>
          <TabsTrigger value="fuel">Mazot Takibi</TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          <div className="space-y-4">
            {/* Harita */}
            <div className="h-[400px] w-full relative bg-gray-50 rounded-lg overflow-hidden">
              <Map 
                selectedPosition={selectedLocation} 
                onPositionSelect={handleLocationSelect}
                locations={locations.map(loc => ({
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  timestamp: loc.timestamp
                }))}
              />
              {selectedLocation && isCreatingLocation && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white p-4 rounded-lg shadow-lg flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <div>Seçilen konum:</div>
                    <div className="font-medium">
                      {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateLocation}>
                      Lokasyon Ekle
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedLocation(null);
                        setIsCreatingLocation(false);
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Lokasyon Tablosu */}
            <Card>
              <CardHeader>
                <CardTitle>Lokasyon Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Konum</TableHead>
                      <TableHead>Sondaj Derinliği</TableHead>
                      <TableHead>Yakıt Tüketimi</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow 
                        key={location.id}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell>{new Date(location.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{location.latitude}, {location.longitude}</TableCell>
                        <TableCell>{location.drilling_depth} m</TableCell>
                        <TableCell>{location.fuel_consumption} Lt</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLocation(location.id);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {locations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          Henüz lokasyon kaydı bulunmuyor.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shifts">
          <div className="space-y-6">
            {/* Hızlı Seçim Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Aktif Vardiya Kartı */}
              <Card className={`p-4 transition-all ${activeShift ? 'bg-green-50' : 'bg-gray-50'}`}>
                <CardHeader className="p-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Aktif Vardiya</CardTitle>
                    {activeShift && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsWorkerModalOpen(true)}
                      >
                        Çalışan Ekle
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  {activeShift ? (
                    <>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Başlangıç: {new Date(activeShift.start_time).toLocaleTimeString()}</p>
                          <Badge className="mt-2" variant="success">Devam Ediyor</Badge>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Çalışanlar ({activeShift.workers?.length || 0})</h4>
                          <div className="space-y-2">
                            {activeShift.workers?.map((workerId) => (
                              <div 
                                key={workerId} 
                                className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm"
                              >
                                <div>
                                  <p className="font-medium">{getWorkerName(workerId)}</p>
                                  <p className="text-sm text-gray-500">{getWorkerRole(workerId)}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveWorker(workerId)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {(!activeShift.workers || activeShift.workers.length === 0) && (
                              <p className="text-sm text-gray-500 text-center py-2">
                                Henüz çalışan eklenmemiş
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Aktif vardiya yok</p>
                  )}
                </CardContent>
              </Card>

              {/* Yeni Vardiya Başlat */}
              <Card 
                className={`p-4 cursor-pointer transition-all ${!activeShift ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50'}`}
                onClick={() => !activeShift && setIsShiftModalOpen(true)}
              >
                <CardHeader className="p-2">
                  <CardTitle className="text-lg">Yeni Vardiya</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <p className="text-sm text-gray-600">
                    {activeShift ? 'Aktif vardiya varken yeni vardiya başlatılamaz' : 'Yeni vardiya başlatmak için tıklayın'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Vardiya Listesi */}
            <Card>
              <CardHeader>
                <CardTitle>Vardiya Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead>Çalışanlar</TableHead>
                      <TableHead>Delgi Miktarı</TableHead>
                      <TableHead>Mazot Tüketimi</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts?.data?.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{new Date(shift.start_time).toLocaleString()}</TableCell>
                        <TableCell>
                          {shift.end_time ? new Date(shift.end_time).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{shift.workers.length} kişi</span>
                            <div className="text-xs text-gray-500">
                              {shift.workers.map(workerId => (
                                <div key={workerId}>
                                  {getWorkerName(workerId)} ({getWorkerRole(workerId)})
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{shift.drilling_depth} m</TableCell>
                        <TableCell>{shift.fuel_consumption} Lt</TableCell>
                        <TableCell>
                          <Badge variant={shift.end_time ? "secondary" : "success"}>
                            {shift.end_time ? "Tamamlandı" : "Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!shift.end_time && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsShiftModalOpen(true);
                              }}
                            >
                              Sonlandır
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!shifts?.data?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          Henüz vardiya kaydı bulunmuyor.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fuel">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Mazot Tüketimi</h2>
              <Button 
                onClick={() => setIsFuelModalOpen(true)}
              >
                Mazot Ekle
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Vardiya</TableHead>
                  <TableHead>Notlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelConsumptions.data?.history.map((consumption) => (
                  <TableRow key={consumption.id}>
                    <TableCell>{new Date(consumption.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{consumption.amount} Lt</TableCell>
                    <TableCell>{consumption.shift || '-'}</TableCell>
                    <TableCell>{consumption.notes || '-'}</TableCell>
                  </TableRow>
                ))}
                {!fuelConsumptions.data?.history.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Henüz mazot tüketim kaydı bulunmuyor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modaller */}
      <ShiftModal
        machineId={machineId}
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        activeShift={activeShift}
      />

      <FuelModal
        machineId={machineId}
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        activeShiftId={activeShift?.id}
      />

      <LocationForm
        machineId={machineId}
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      <WorkerModal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        shiftId={activeShift?.id}
        onWorkerAdd={handleAddWorker}
      />
    </div>
  );
} 