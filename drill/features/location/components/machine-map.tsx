'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkerAssignments } from '@/features/machines/hooks/useWorkerAssignments';
import { useUsers } from '@/features/user/hooks/useUsers';
import { useMachines } from '@/features/machines/hooks/useMachines';
import { MapProps, MapMarker, Worker } from '../types';
import { MachineLocation } from './machine-location';
import dynamic from 'next/dynamic';
import type { MapContainerProps, TileLayerProps, MarkerProps, PopupProps } from 'react-leaflet';
import L from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

// Makine durumu için tip tanımlaması
type MachineStatus = 'DRILLING' | 'MOVING' | 'MAINTENANCE' | 'IDLE' | 'SETUP';

interface Machine {
  id: number;
  name: string;
  description?: string;
  status: MachineStatus;
  is_active: boolean;
}

// Makine renkleri ve statüleri
const MACHINE_COLORS: Record<MachineStatus | 'selected' | 'active' | 'inactive', string> = {
  DRILLING: '#2563eb',    // Sondaj - Mavi
  MOVING: '#f59e0b',      // Nakliye - Turuncu
  MAINTENANCE: '#dc2626',  // Bakım - Kırmızı
  IDLE: '#9ca3af',        // Boşta - Gri
  SETUP: '#10b981',       // Kurulum - Yeşil
  selected: '#7c3aed',    // Seçili - Mor
  active: '#10b981',      // Aktif - Yeşil
  inactive: '#9ca3af'     // Pasif - Gri
};

// Statü açıklamaları
const STATUS_LABELS: Record<MachineStatus, string> = {
  DRILLING: 'Sondaj',
  MOVING: 'Nakliye',
  MAINTENANCE: 'Bakım',
  IDLE: 'Boşta',
  SETUP: 'Kurulum',
};

interface MachineLocation {
  id: number;
  machine: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  heading?: number;
  accuracy?: number;
}

// Özel makine ikonu oluştur
const createMachineIcon = (color: string = '#2563eb', heading: number = 0) => {
  return L.divIcon({
    className: 'custom-machine-marker',
    html: `
      <div class="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center relative"
           style="border: 3px solid ${color}; transform: rotate(${heading}deg)">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 10V7c0-1.103-.897-2-2-2h-2.5l-1-2h-3l-1 2H7c-1.103 0-2 .897-2 2v3m14 0v10c0 1.103-.897 2-2 2H7c-1.103 0-2-.897-2-2V10m14 0H5m5 4v4m4-4v4" />
        </svg>
        <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
          <div class="w-4 h-4 bg-white rounded-full border-2" style="border-color: ${color}"></div>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });
};

// Çalışan profil komponenti
function WorkerProfile({
  worker,
  machineColor,
  machines
}: {
  worker: Worker;
  machineColor: string;
  machines: Array<{ id: number; name: string; }>;
}) {
  const machineName = worker.machineId
    ? machines.find(m => m.id === worker.machineId)?.name || `Makine ${worker.machineId}`
    : 'Atanmamış';

  return (
    <div className="group relative">
      <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-200">
        <div
          className={`
            relative w-10 h-10 rounded-full flex items-center justify-center
            text-sm font-medium text-white shadow-md
            transition-all duration-200 group-hover:scale-110
            ${worker.machineId ? `ring-2 ring-offset-2 ring-[${machineColor}]` : ''}
          `}
          style={{ backgroundColor: machineColor }}
        >
          {worker.name[0]}{worker.surname[0]}
          <div className="absolute -bottom-0.5 -right-0.5">
            <div className={`
              w-3.5 h-3.5 rounded-full border-2 border-white
              ${worker.role === 'ENGINEER' ? 'bg-blue-500' : 'bg-yellow-500'}
            `} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs text-gray-900 truncate">
            {worker.name} {worker.surname}
          </div>
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            <span>{worker.role === 'ENGINEER' ? 'Mühendis' : 'İşçi'}</span>
            <span>•</span>
            <span className="truncate">{machineName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MachineMap({
  center,
  zoom,
  markers,
  location,
  machineName
}: MapProps) {
  const [machineLocations, setMachineLocations] = useState<MachineLocation[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);

  const { data: machines = [], isLoading: isMachinesLoading, error: machinesError } = useMachines();
  const { data: assignments = [] } = useWorkerAssignments();
  const { data: users = [] } = useUsers();

  const handleLocationUpdate = useCallback(async (machineId: number, location: MachineLocation | null): Promise<boolean> => {
    console.log('Location update received:', { machineId, location });
    
    try {
      setMachineLocations(prev => {
        if (!location) {
          return prev.filter(loc => loc.machine !== machineId);
        }

        const existingIndex = prev.findIndex(loc => loc.machine === machineId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = location;
          return updated;
        }
        
        return [...prev, location];
      });
      
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    console.log('Current machine locations:', machineLocations);
  }, [machineLocations]);

  // Debug için makine konumlarını konsola yazdır
  useEffect(() => {
    if (machines.length > 0) {
      console.log('Available machines:', machines);
    }
  }, [machines]);

  const getMachineWorkers = useCallback((machineId: number): Worker[] => {
    const machineAssignments = assignments.filter(
      a => a.machine === machineId && a.is_active
    );
    const workers: Worker[] = [];

    machineAssignments.forEach(assignment => {
      const worker = users.find(u => u.id === assignment.worker);
      if (worker) {
        workers.push({
          id: worker.id,
          name: worker.name,
          surname: worker.surname,
          role: worker.role as 'WORKER' | 'ENGINEER',
          machineId
        });
      }
    });

    return workers;
  }, [assignments, users]);

  // Tüm çalışanları getir
  const allWorkers = useMemo(() => {
    const workersArray: Worker[] = [];
    const processedWorkers = new Set<number>();

    assignments.forEach(assignment => {
      if (assignment.is_active) {
        const worker = users.find(u => u.id === assignment.worker);
        if (worker && !processedWorkers.has(worker.id)) {
          processedWorkers.add(worker.id);
          workersArray.push({
            id: worker.id,
            name: worker.name,
            surname: worker.surname,
            role: worker.role as 'WORKER' | 'ENGINEER',
            machineId: assignment.machine
          });
        }
      }
    });

    users.forEach(user => {
      if (!processedWorkers.has(user.id)) {
        workersArray.push({
          id: user.id,
          name: user.name,
          surname: user.surname,
          role: user.role as 'WORKER' | 'ENGINEER'
        });
      }
    });

    return workersArray;
  }, [assignments, users]);

  const locationTrackers = useMemo(() => {
    return machines.map(machine => (
      <MachineLocation
        key={machine.id}
        machineId={machine.id}
        onLocationUpdate={(location) => handleLocationUpdate(machine.id, location)}
      />
    ));
  }, [machines, handleLocationUpdate]);

  // Default merkez noktası (Türkiye'nin merkezi)
  const defaultCenter: [number, number] = [39.9334, 32.8597];

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* Çalışan Profilleri Paneli */}
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-white border-b border-gray-200 shadow-md z-[800]">
        <div className="h-full p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Çalışanlar</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 overflow-y-auto h-[calc(100%-2rem)]">
            {allWorkers.map(worker => (
              <WorkerProfile
                key={worker.id}
                worker={worker}
                machineColor={worker.machineId ? MACHINE_COLORS[machines.find(m => m.id === worker.machineId)?.status as MachineStatus || 'IDLE'] : MACHINE_COLORS.inactive}
                machines={machines}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Harita */}
      <div className="w-full h-full">
        <MapContainer
          center={center || defaultCenter}
          zoom={zoom || 6}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {machineLocations.map((location) => {
            const machine = machines.find(m => m.id === location.machine);
            if (!machine) return null;

            const icon = createMachineIcon(
              selectedMachine === machine.id
                ? MACHINE_COLORS.selected
                : MACHINE_COLORS[machine.status as MachineStatus],
              location.heading
            );

            const workers = getMachineWorkers(machine.id);

            return (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedMachine(machine.id)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold mb-2">{machine.name}</h3>
                    <div className="text-sm text-gray-600">
                      <p>Durum: {STATUS_LABELS[machine.status as MachineStatus]}</p>
                      {workers.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">Çalışanlar:</p>
                          <ul className="list-disc list-inside">
                            {workers.map(worker => (
                              <li key={worker.id}>
                                {worker.name} {worker.surname} ({worker.role === 'ENGINEER' ? 'Mühendis' : 'İşçi'})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Konum Takip Bileşenleri */}
      {locationTrackers}
    </div>
  );
} 