
'use client';

import { useEffect, useRef } from 'react';
import type { LatLng, LatLngTuple } from 'leaflet';
import L from 'leaflet'; // Import L directly
import 'leaflet.markercluster'; // Import for side effects
import type { Post, PostCategory } from '@/types';
import { Mountain, Building2, Waves, Utensils, Landmark, Trees, MapPin as OtherPinIcon } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import { cn } from '@/lib/utils';

// Fix default Leaflet icon paths if served locally
// User must place these images in public/images/
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
  });
}

const categoryIcons: Record<PostCategory, JSX.Element> = {
  hiking: <Mountain className="h-5 w-5 text-white" />,
  city: <Building2 className="h-5 w-5 text-white" />,
  beach: <Waves className="h-5 w-5 text-white" />,
  food: <Utensils className="h-5 w-5 text-white" />,
  culture: <Landmark className="h-5 w-5 text-white" />,
  nature: <Trees className="h-5 w-5 text-white" />,
  other: <OtherPinIcon className="h-5 w-5 text-white" />,
};

const categoryColors: Record<PostCategory, string> = {
  hiking: '#008000', // Green
  city: '#808080',   // Gray
  beach: '#00BFFF',  // DeepSkyBlue
  food: '#FFA500',   // Orange
  culture: '#800080',// Purple
  nature: '#228B22', // ForestGreen
  other: '#FF4500',  // OrangeRed
};

const createCustomIcon = (category: PostCategory): L.DivIcon => {
  const iconHtml = ReactDOMServer.renderToString(
    <div style={{
      backgroundColor: categoryColors[category] || categoryColors.other,
      padding: '5px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      width: '32px',
      height: '32px',
    }}>
      {categoryIcons[category] || categoryIcons.other}
    </div>
  );
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};


interface InteractiveMapProps {
  posts?: Post[];
  onMapClick?: (latlng: L.LatLng) => void;
  selectedLocation?: L.LatLngTuple;
  center?: L.LatLngTuple;
  zoom?: number;
  className?: string;
  onPostClick?: (postId: string) => void;
}

export default function InteractiveMap({
  posts = [],
  onMapClick,
  selectedLocation,
  center = [20, 0], 
  zoom = 2,       
  className = "h-[500px] w-full",
  onPostClick,
}: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);

  // Effect for map creation, view, and base tile layer
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapRef.current) { // Prevent re-initialization
      return;
    }

    const newMap = L.map(mapContainerRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(newMap);

    const newMarkersLayer = L.markerClusterGroup();
    newMap.addLayer(newMarkersLayer);

    mapRef.current = newMap;
    markersLayerRef.current = newMarkersLayer;

    if (onMapClick) {
      newMap.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng);
      });
    }
    
    newMap.invalidateSize();


    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.toString(), zoom, onMapClick]); // center needs stable comparison, stringify or use separate states if mutable. onMapClick should be stable via useCallback.

  // Effect for updating post markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) {
      return;
    }
    markersLayerRef.current.clearLayers();
    posts.forEach(post => {
      if (post.coordinates) {
        const marker = L.marker([post.coordinates.latitude, post.coordinates.longitude], {
          icon: createCustomIcon(post.category || 'other'),
        })
        .bindPopup(`<b>${post.title}</b><br>${post.description.substring(0,100)}...`);
        
        if(onPostClick) {
          marker.on('click', () => onPostClick(post.id));
        }
        markersLayerRef.current?.addLayer(marker);
      }
    });
  }, [posts, onPostClick]);

  // Effect for selected location marker
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (selectedMarkerRef.current) {
      mapRef.current.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    if (selectedLocation) {
      const newSelectedMarker = L.marker(selectedLocation, { draggable: true })
        .addTo(mapRef.current)
        .bindPopup('Selected Location');
      
      newSelectedMarker.on('dragend', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        if(onMapClick) onMapClick(position);
      });
      
      selectedMarkerRef.current = newSelectedMarker;
      
      // If onMapClick is defined, this map is likely for selection, so zoom in.
      const targetZoom = onMapClick ? 13 : mapRef.current.getZoom();
      mapRef.current.setView(selectedLocation, targetZoom);
    }
  }, [selectedLocation, onMapClick]);

  return <div ref={mapContainerRef} className={cn('bg-muted rounded-lg shadow-md overflow-hidden', className)} />;
}
