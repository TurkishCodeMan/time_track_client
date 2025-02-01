export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface MapProps {
  location: Location | null;
  machineName: string;
} 

import { ReactNode } from 'react';

export interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  popupContent: ReactNode;
}

export interface MapProps {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
} 