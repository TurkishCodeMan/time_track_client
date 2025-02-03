"use client"

import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import dynamic from "next/dynamic"
import { WorkerCard } from "@/features/worker/components/worker-card"
import { EngineerCard } from "@/features/worker/components/engineer-card"
import { MachineCard } from "@/features/machines/components/machine-card"
import { useToast } from "@/components/ui/use-toast"
import { useMachines } from "@/features/machines/hooks/useMachines"
import { useUsers } from "@/features/user/hooks/useUsers"
import { useWorkerAssignments } from "@/features/machines/hooks/useWorkerAssignments"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Shield, Users, Cpu } from "lucide-react"
import { useState } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DndProviderWithNoSSR = dynamic(
  () =>
    Promise.resolve(({ children }: { children: React.ReactNode }) => (
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
    )),
  { ssr: false },
)

const MachineMapWithNoSSR = dynamic(() => import("@/features/location/components/machine-map"), { ssr: false })

interface Worker {
  id: number
  name: string
  surname: string
  role: "WORKER" | "ENGINEER"
}

interface ApiError {
  response?: {
    data?: {
      error?: string
    }
  }
  message: string
}

export default function MachineDashboard() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

  // Data fetching hooks
  const { data: machines = [], isLoading: isMachinesLoading } = useMachines()
  const { data: workers = [] } = useUsers("WORKER")
  const { data: engineers = [] } = useUsers("ENGINEER")
  const { data: assignments = [], assignWorker, unassignWorker } = useWorkerAssignments()

  // Find assigned workers for a machine
  const findAssignedWorkers = (machineId: number) => {
    const machineAssignments = assignments.filter((a) => a.machine === machineId && a.is_active)
    return machineAssignments
      .map((assignment) => {
        const user = [...workers, ...engineers].find((w) => w.id === assignment.worker)
        if (!user) return null
        return {
          id: user.id,
          name: user.name,
          surname: user.surname,
          role: user.role as "WORKER" | "ENGINEER",
        }
      })
      .filter((user): user is Worker => user !== null)
  }

  // Worker assignment handler
  const handleWorkerAssign = async (machineId: number, workerId: number) => {
    try {
      await assignWorker({ machineId, workerId })
      toast({
        title: "Başarılı",
        description: "Çalışan başarıyla atandı.",
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Çalışan atanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Worker unassignment handler
  const handleWorkerUnassign = async (machineId: number, workerId: number) => {
    try {
      await unassignWorker({ machineId, workerId })
      toast({
        title: "Başarılı",
        description: "Çalışan ataması başarıyla kaldırıldı.",
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Hata",
        description: apiError.response?.data?.error || "Çalışan ataması kaldırılırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Filter machines based on search term
  const filteredMachines = machines.filter((machine) => machine.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (isMachinesLoading) {
    return (
      <div className="flex items-center justify-center h-screen ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-blue-800 text-xl font-semibold">Güvenli ortam yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Makine Yönetim Paneli</h1>
          <p className="text-blue-600">Endüstriyel operasyonlarınızın güvenli ve verimli kontrolü</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Makine</CardTitle>
              <Cpu className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{machines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Çalışanlar</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistem Güvenliği</CardTitle>
              <Shield className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Korumalı</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="map" className="text-lg">
              Harita Görünümü
            </TabsTrigger>
            <TabsTrigger value="list" className="text-lg">
              Liste Görünümü
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <Card>
              <CardContent className="p-6">
                <MachineMapWithNoSSR />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
                    <Input
                      placeholder="Makinelerde ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 py-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <DndProviderWithNoSSR>
                  <div className="grid grid-cols-12 gap-6">
                    {/* Workers */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                      <h2 className="text-xl font-semibold mb-4 text-blue-900">Çalışanlar</h2>
                      {workers.map((worker) => (
                        <WorkerCard key={worker.id} worker={worker} />
                      ))}
                    </div>

                    {/* Machines */}
                    <div className="col-span-12 lg:col-span-6">
                      <h2 className="text-xl font-semibold mb-4 text-blue-900">Makineler</h2>
                      <div className="grid grid-cols-1 gap-4">
                        {filteredMachines.map((machine) => (
                          <MachineCard
                            key={machine.id}
                            machine={{ ...machine, is_active: true, status: machine.status || "BOŞTA" }}
                            assignedWorkers={findAssignedWorkers(machine.id)}
                            onWorkerAssign={(workerId) => handleWorkerAssign(machine.id, workerId)}
                            onWorkerUnassign={(workerId) => handleWorkerUnassign(machine.id, workerId)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Engineers */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                      <h2 className="text-xl font-semibold mb-4 text-blue-900">Mühendisler</h2>
                      {engineers.map((engineer) => (
                        <EngineerCard key={engineer.id} engineer={engineer} />
                      ))}
                    </div>
                  </div>
                </DndProviderWithNoSSR>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

