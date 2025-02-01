'use client';

import { useEffect, useCallback, useState } from 'react';
import { useLocation } from '../hooks/useLocation';

interface MachineLocationProps {
  machineId: number;
  onLocationUpdate: (location: {
    id: number;
    machine: number;
    latitude: number;
    longitude: number;
    heading: number;
    accuracy: number;
    timestamp: string;
  } | null) => Promise<boolean>;
}

export function MachineLocation({ machineId, onLocationUpdate }: MachineLocationProps) {
  const { location, error, startTracking } = useLocation(machineId);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    startTracking();
  }, [startTracking]);

  useEffect(() => {
    const updateLocation = async () => {
      if (location && !isUpdating) {
        try {
          setIsUpdating(true);
          console.log('Updating location for machine:', machineId, location);
          
          await onLocationUpdate({
            id: location.id,
            machine: machineId,
            latitude: location.latitude,
            longitude: location.longitude,
            heading: location.heading || 0,
            accuracy: location.accuracy,
            timestamp: location.timestamp
          });
          
          setIsUpdating(false);
        } catch (error) {
          console.error('Location update error:', error);
          setIsUpdating(false);
        }
      }
    };

    updateLocation();
  }, [location, machineId, onLocationUpdate, isUpdating]);

  if (error) {
    console.error('Location error:', error);
  }

  return null;
} 