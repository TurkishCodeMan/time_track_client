"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useMachine } from "@/features/machines/hooks/useMachine"
import { useLocationHistory } from "@/features/location/hooks/useLocationHistory"
import { useShifts } from "@/features/machines/hooks/useShifts"
import { useFuelConsumption } from "@/features/machines/hooks/useFuelConsumption"
import { useUsers } from "@/features/user/hooks/useUsers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ShiftModal } from "@/features/machines/components/shift-modal"
import { FuelModal } from "@/features/machines/components/fuel-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LocationForm } from "@/features/location/components/location-form"
import dynamic from "next/dynamic"
import { api } from "@/lib/api"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { Trash2, MapPin, Users, Droplet } from "lucide-react"
import { WorkerModal } from "@/features/machines/components/worker-modal"

interface ApiError {
  response?: {
    data?: {
      error?: string
    }
  }
  message: string
}

const Map = dynamic(() => import("@/features/location/components/map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Harita yükleniyor...</p>
      </div>
    </div>
  ),
})

export default function MachineDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const machineId = Number(params.id)

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false)

  const { data: machine, isLoading: isMachineLoading } = useMachine(machineId)
  const { data: locations = [], refetch } = useLocationHistory(machineId)
  const { shifts, refetch: refetchShifts } = useShifts(machineId)
  const { fuelConsumptions } = useFuelConsumption(machineId)
  const { getWorkerName, getWorkerRole } = useUsers()

  const totalDrillingDepth =
    shifts?.data?.reduce((total, shift) => {
      return shift.end_time ? total + (Number(shift.drilling_depth) || 0) : total
    }, 0) || 0
  const totalFuelConsumption = fuelConsumptions.data?.total_consumption || 0
  const activeShift = shifts?.data?.find((shift) => !shift.end_time)

  const { getToken } = useAuth()
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null)
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation([Number(lat), Number(lng)])
    setIsCreatingLocation(true)
  }

  const handleCreateLocation = async () => {
    if (!selectedLocation) return

    try {
      const token = await getToken()
      if (!token) throw new Error("No token available")

      const [lat, lng] = selectedLocation.map((coord) => Number(coord.toFixed(6)))

      const data = {
        latitude: lat,
        longitude: lng,
        accuracy: 0,
        heading: 0,
        drilling_depth: 0,
        fuel_consumption: 0,
      }

      await api.post(`/machines/${machineId}/locations/history/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await refetch()

      toast({
        title: "Başarılı",
        description: "Yeni konum başarıyla eklendi",
      })

      setIsCreatingLocation(false)
      setSelectedLocation(null)
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error("Location creation error:", apiError.response?.data || apiError)
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Konum eklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLocation = async (locationId: number) => {
    try {
      const token = await getToken()
      if (!token) throw new Error("Token not found")

      await api.delete(`/machines/${machineId}/locations/history/${locationId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await refetch()

      toast({
        title: "Başarılı",
        description: "Konum başarıyla silindi",
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error("Location deletion error:", apiError.response?.data || apiError)
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Konum silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleAddWorker = async (worker: { name: string; role: string }) => {
    try {
      const token = await getToken()
      if (!token) throw new Error("Token not found")

      const data = {
        name: worker.name,
        role: worker.role,
        machine: machineId,
        shift: activeShift?.id,
      }

      await api.post(`/machines/${machineId}/shifts/${activeShift?.id}/workers/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await refetchShifts()

      toast({
        title: "Başarılı",
        description: "Çalışan başarıyla eklendi",
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error("Worker addition error:", apiError.response?.data || apiError)
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Çalışan eklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleRemoveWorker = async (workerId: number) => {
    try {
      const token = await getToken()
      if (!token) throw new Error("Token not found")

      await api.delete(`/machines/${machineId}/shifts/${activeShift?.id}/workers/${workerId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await refetchShifts()

      toast({
        title: "Başarılı",
        description: "Çalışan başarıyla kaldırıldı",
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error("Worker removal error:", apiError.response?.data || apiError)
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Çalışan kaldırılırken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  if (isMachineLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
        <div className="h-[200px] w-full bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-red-800 font-medium">Hata</h2>
          <p className="text-red-600">Makine bilgileri yüklenirken bir hata oluştu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{machine.name}</h1>
          <p className="text-gray-500 mt-1">{machine.description}</p>
        </div>
        <Badge variant={machine.is_active ? "success" : "secondary"} className="text-lg py-1 px-3">
          {machine.is_active ? "Aktif" : "Pasif"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sondaj</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrillingDepth} m</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Yakıt Tüketimi</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFuelConsumption} Lt</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Vardiya</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeShift ? "Evet" : "Hayır"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shifts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {/*<TabsTrigger value="locations">Konumlar</TabsTrigger>*/}
          <TabsTrigger value="shifts">Vardiyalar</TabsTrigger>
          <TabsTrigger value="fuel">Yakıt Takibi</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          <div className="h-[400px] w-full relative bg-gray-50 rounded-lg overflow-hidden">
            <Map
              selectedPosition={selectedLocation}
              onPositionSelect={handleLocationSelect}
              locations={locations.map((loc) => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                timestamp: loc.timestamp,
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
                  <Button
                    size="sm"
                    onClick={handleCreateLocation}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Konum Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedLocation(null)
                      setIsCreatingLocation(false)
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Konum Geçmişi</CardTitle>
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
                    <TableRow key={location.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>{new Date(location.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </TableCell>
                      <TableCell>{location.drilling_depth} m</TableCell>
                      <TableCell>{location.fuel_consumption} Lt</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteLocation(location.id)
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
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        Konum kaydı bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={`transition-all ${activeShift ? "bg-green-50" : "bg-gray-50"}`}>
              <CardHeader className="p-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Aktif Vardiya</CardTitle>
                  {activeShift && (
                    <Button variant="outline" size="sm" onClick={() => setIsWorkerModalOpen(true)}>
                      Çalışan Ekle
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {activeShift ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Başlangıç: {new Date(activeShift.start_time).toLocaleTimeString()}
                        </p>
                        <Badge className="mt-2" variant="success">
                          Devam Ediyor
                        </Badge>
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
                            <p className="text-sm text-gray-500 text-center py-2">Henüz çalışan eklenmemiş</p>
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

            <Card
              className={`cursor-pointer transition-all ${!activeShift ? "bg-blue-50 hover:bg-blue-100" : "bg-gray-50"}`}
              onClick={() => !activeShift && setIsShiftModalOpen(true)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Yeni Vardiya</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  {activeShift ? "Aktif vardiya varken yeni vardiya başlatılamaz" : "Yeni vardiya başlatmak için tıklayın"}
                </p>
              </CardContent>
            </Card>
          </div>

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
                    <TableHead>Sondaj Miktarı</TableHead>
                    <TableHead>Yakıt Tüketimi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts?.data?.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell>{new Date(shift.start_time).toLocaleString()}</TableCell>
                      <TableCell>{shift.end_time ? new Date(shift.end_time).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{shift.workers.length} kişi</span>
                          <div className="text-xs text-gray-500">
                            {shift.workers.map((workerId) => (
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
                              setIsShiftModalOpen(true)
                            }}
                            className="text-yellow-600 hover:text-yellow-700 border-yellow-600 hover:border-yellow-700"
                          >
                            Vardiyayı Bitir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!shifts?.data?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        Vardiya kaydı bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Yakıt Tüketimi</h2>
              <Button onClick={() => setIsFuelModalOpen(true)}>Yakıt Ekle</Button>
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
                    <TableCell>{consumption.shift || "-"}</TableCell>
                    <TableCell>{consumption.notes || "-"}</TableCell>
                  </TableRow>
                ))}
                {!fuelConsumptions.data?.history.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Yakıt tüketim kaydı bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

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

      <LocationForm machineId={machineId} isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />

      <WorkerModal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        shiftId={activeShift?.id}
        onWorkerAdd={handleAddWorker}
      />
    </div>
  )
}

