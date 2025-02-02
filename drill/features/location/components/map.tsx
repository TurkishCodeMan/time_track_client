'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const EventComponent = dynamic(
  () => import('react-leaflet').then((mod) => {
    const EventComponent = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
      const map = mod.useMapEvents({
        click: (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        },
      });
      return null;
    };
    return EventComponent;
  }),
  { ssr: false }
);

interface MapProps {
  selectedPosition: [number, number] | null;
  onPositionSelect: (lat: number, lng: number) => void;
  locations?: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
}

function MapComponent({ selectedPosition, onPositionSelect, locations = [] }: MapProps) {
  // Hekimhan/Hasançelebi koordinatları
  const defaultCenter: [number, number] = [38.992688, 37.845787];
  const mapRef = useRef<L.Map | null>(null);
  const [mapKey, setMapKey] = useState<string>('map-1'); // Unique key for map container

  useEffect(() => {
    // Harita zaten başlatılmışsa, yeni bir başlatma yapmayı engelle
    if (mapRef.current) {
      return;
    }

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/images/marker-icon-2x.png',
      iconUrl: '/images/marker-icon.png',
      shadowUrl: '/images/marker-shadow.png',
    });
  }, []);

  // Harita yeniden başlatılması gerektiğinde key'i değiştir
  useEffect(() => {
    if (!mapRef.current) {
      setMapKey(`map-${Date.now()}`);
    }
  }, []);

  // Özel marker ikonları
  const selectedIcon = new L.Icon({
    iconUrl: '/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  const normalIcon = new L.Icon({
    iconUrl: '/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  const activeIcon = new L.Icon({
    iconUrl: '/images/marker-icon-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  // Lokasyonlara göre haritayı konumlandır
  useEffect(() => {
    if (mapRef.current && locations.length > 0) {
      const bounds = new L.LatLngBounds(
        locations.map(loc => [Number(loc.latitude), Number(loc.longitude)])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations]);

  // En son lokasyonu bul
  const latestLocation = useMemo(() => {
    if (locations.length === 0) return null;
    return locations.reduce((latest, current) => {
      return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
    }, locations[0]);
  }, [locations]);

  return (
    <div className="h-full w-full relative">
      <style jsx global>{`
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          z-index: 1;
          position: relative;
        }
        .leaflet-control-container {
          z-index: 999;
          position: relative;
        }
        .leaflet-pane {
          z-index: 1;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 999;
          position: absolute;
        }
      `}</style>
      <MapContainer
        key={mapKey}
        center={selectedPosition || defaultCenter}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        ref={mapRef}
      >
      <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={20}
                  
                />
        {/* Click olayını dinle */}
        <EventComponent onMapClick={onPositionSelect} />
        {/* Geçmiş lokasyonlar */}
        {locations.map((location, index) => {
          // String değerleri number'a çevir
          const lat = Number(location.latitude);
          const lng = Number(location.longitude);
          const isLatest = latestLocation && 
            lat === Number(latestLocation.latitude) && 
            lng === Number(latestLocation.longitude);
          
          return (
            <Marker
              key={`${lat}-${lng}-${index}`}
              position={[lat, lng]}
              icon={isLatest ? activeIcon : normalIcon}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-medium">Lokasyon Bilgisi</div>
                  <div className="text-sm text-gray-600">
                    <div>Tarih: {new Date(location.timestamp).toLocaleString()}</div>
                    <div>Koordinatlar: {lat.toFixed(6)}, {lng.toFixed(6)}</div>
                    {isLatest && <div className="font-medium text-green-600">Aktif Lokasyon</div>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* Seçili lokasyon */}
        {selectedPosition && !locations.some(loc => 
          Number(loc.latitude) === selectedPosition[0] && 
          Number(loc.longitude) === selectedPosition[1]
        ) && (
          <Marker 
            position={selectedPosition} 
            icon={selectedIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="font-medium">Yeni Lokasyon</div>
                <div className="text-sm text-gray-600">
                  <div>Koordinatlar: {Number(selectedPosition[0]).toFixed(6)}, {Number(selectedPosition[1]).toFixed(6)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// Client-side'da yüklenecek şekilde export edelim
export default dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      Harita yükleniyor...
    </div>
  ),
}); 