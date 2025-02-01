import { ReactNode } from 'react';

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  } | null;
  machineName?: string;
}

export interface Worker {
  id: number;
  name: string;
  surname: string;
  role: 'WORKER' | 'ENGINEER';
  machineId?: number;
}

export interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  label?: string;
  color?: string;
}

export interface LocationRecord {
  id: number;
  machine: number;
  latitude: number;
  longitude: number;
  heading: number | null;
  accuracy: number;
  timestamp: string;
  drilling_depth: number;
  fuel_consumption: number;
  shift_id: number | null;
}

export interface Shift {
  id: number;
  machine: number;
  start_time: string;
  end_time: string | null;
  workers: number[];
  fuel_consumption: number;
  drilling_depth: number;
} 