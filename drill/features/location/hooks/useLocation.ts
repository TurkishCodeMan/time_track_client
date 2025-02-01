import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { api } from '@/lib/api';

export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  heading: number | null;
  accuracy: number;
  timestamp: string;
}

interface LocationResponse {
  id: number;
  machine: number;
  latitude: number;
  longitude: number;
  heading: number | null;
  accuracy: number;
  timestamp: string;
}

function isValidLocation(data: any): data is LocationResponse {
  return (
    data &&
    typeof data.id === 'number' &&
    typeof data.machine === 'number' &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number' &&
    (data.heading === null || typeof data.heading === 'number') &&
    typeof data.accuracy === 'number' &&
    typeof data.timestamp === 'string'
  );
}

export function useLocation(machineId: number) {
  console.log('useLocation hook initialized for machine:', machineId);
  
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { getToken } = useAuth();

  const processLocationData = (data: any) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    
    const latest = data[0];
    
    return {
      id: latest.id,
      machine: latest.machine,
      latitude: parseFloat(latest.latitude),
      longitude: parseFloat(latest.longitude),
      accuracy: parseFloat(latest.accuracy || "0"),
      heading: parseFloat(latest.heading || "0"),
      timestamp: latest.timestamp
    };
  };

  const fetchLocation = useCallback(async () => {
    console.log('fetchLocation called for machine:', machineId);
    
    try {
      const token = await getToken();
      console.log('Token received:', token ? 'Present' : 'Missing');

      if (!token) {
        console.log('No token available');
        return;
      }

      if (!process.env.NEXT_PUBLIC_API_URL) {
        console.error('NEXT_PUBLIC_API_URL is not defined');
        setError(new Error('API URL tanımlanmamış'));
        return;
      }

      const apiUrl = `/locations/?machine_id=${machineId}`;
      console.log('Making API request to:', apiUrl);
      
      const response = await api.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Raw API Response:', response.data);
      
      const data = response.data;
      if (!Array.isArray(data)) {
        console.error('API response is not an array:', data);
        setError(new Error('Geçersiz API yanıtı'));
        return;
      }

      if (data.length === 0) {
        console.log('No location data available for machine:', machineId);
        setLocation(null);
        return;
      }

      const processedData = processLocationData(data);
      console.log('Latest location data:', processedData);
      
      if (processedData) {
        setLocation(processedData);
      }

    } catch (error) {
      console.error('Error fetching location:', error);
      setError(error as Error);
    }
  }, [machineId, getToken]);

  const startTracking = useCallback(() => {
    console.log('Starting tracking for machine:', machineId);
    setIsTracking(true);
  }, [machineId]);

  const stopTracking = useCallback(() => {
    console.log('Stopping tracking for machine:', machineId);
    setIsTracking(false);
  }, [machineId]);

  useEffect(() => {
    console.log('Initial location fetch effect triggered for machine:', machineId);
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    console.log('Tracking effect triggered for machine:', machineId, 'isTracking:', isTracking);
    
    let intervalId: NodeJS.Timeout;

    if (isTracking) {
      intervalId = setInterval(fetchLocation, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTracking, fetchLocation]);

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking
  };
}