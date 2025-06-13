
'use client';

import { useEffect, useRef, useState } from 'react';
import L, { LatLngExpression, Icon } from 'leaflet';
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
    className: 'custom-marker-icon', // Keep this class for potential global styling
    iconSize: [32, 32],
    iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
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
  center = [20, 0], // Default center (world view)
  zoom = 2,       // Default zoom
  className = "h-[500px] w-full",
  onPostClick,
}: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && mapContainerRef.current && !mapInitialized) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapRef.current = map;
      markersLayerRef.current = L.markerClusterGroup().addTo(map);
      setMapInitialized(true);

      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng);
        });
      }
    }
     // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove(); // This should also clean up listeners attached to the map instance.
        mapRef.current = null;
        // setMapInitialized(false); // Removed this line
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, zoom, onMapClick]); // mapInitialized is NOT a dependency here intentionally

  useEffect(() => {
    if (mapRef.current && markersLayerRef.current && mapInitialized) { // Ensure map is initialized
      markersLayerRef.current.clearLayers(); // Clear old markers
      posts.forEach(post => {
        if (post.coordinates) {
          const marker = L.marker([post.coordinates.latitude, post.coordinates.longitude], {
            icon: createCustomIcon(post.category || 'other'),
          })
          .bindPopup(`<b>${post.title}</b><br>${post.description.substring(0,100)}...`);
          
          if(onPostClick) {
            // Define the handler function separately to potentially help with debugging or future memoization
            const handleMarkerClick = () => {
              onPostClick(post.id);
            };
            marker.on('click', handleMarkerClick);
          }
          markersLayerRef.current?.addLayer(marker);
        }
      });
    }
  }, [posts, mapInitialized, onPostClick]);

  useEffect(() => {
    if (mapRef.current && mapInitialized) { // Ensure map is initialized
        if (selectedLocation) {
            if (selectedMarkerRef.current) {
                selectedMarkerRef.current.setLatLng(selectedLocation);
            } else {
                selectedMarkerRef.current = L.marker(selectedLocation, { draggable: true })
                .addTo(mapRef.current)
                .bindPopup('Selected Location');
                
                selectedMarkerRef.current.on('dragend', (event) => {
                    const marker = event.target;
                    const position = marker.getLatLng();
                    if(onMapClick) onMapClick(position);
                });
            }
            mapRef.current.setView(selectedLocation, mapRef.current.getZoom());
        } else if (selectedMarkerRef.current) { // If no selectedLocation, but marker exists, remove it
            mapRef.current.removeLayer(selectedMarkerRef.current);
            selectedMarkerRef.current = null;
        }
    }
  }, [selectedLocation, mapInitialized, onMapClick]);
  

  return <div ref={mapContainerRef} className={cn('bg-muted rounded-lg shadow-md overflow-hidden', className)} />;
}
