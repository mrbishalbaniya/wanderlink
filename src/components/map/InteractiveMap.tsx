
'use client';

import { useEffect, useRef, useState } from 'react';
import type { LatLng, LatLngTuple, Map as LeafletMapInstance } from 'leaflet'; 
import L from 'leaflet'; 
import 'leaflet.markercluster'; 
import type { Post, PostCategory } from '@/types';
import { Mountain, Building2, Waves, Utensils, Landmark, Trees, MapPin as OtherPinIcon, Home } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import { cn } from '@/lib/utils';

// Fix default Leaflet icon paths if served locally
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
  hiking: '#008000', 
  city: '#808080',   
  beach: '#00BFFF',  
  food: '#FFA500',   
  culture: '#800080',
  nature: '#228B22', 
  other: '#FF4500',  
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
  setMapInstance?: (map: LeafletMapInstance | null) => void; 
}

export default function InteractiveMap({
  posts = [],
  onMapClick,
  selectedLocation,
  center = [20, 0], 
  zoom = 2,       
  className = "h-[500px] w-full",
  onPostClick,
  setMapInstance,
}: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);


  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapRef.current) { 
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

    if (setMapInstance) {
      setMapInstance(newMap); 
    }

    if (onMapClick) {
      newMap.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng);
      });
    }
    
    newMap.invalidateSize();

    return () => {
      if (mapRef.current) {
        if (setMapInstance) {
          setMapInstance(null); 
        }
        mapRef.current.remove();
      }
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.toString(), zoom, onMapClick, setMapInstance]); 

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setGeolocationError(null);
        },
        (error) => {
          console.error("Error getting user location:", error);
          setGeolocationError(error.message || "Could not retrieve location. Please ensure location services are enabled.");
          // Consider using a toast to inform the user if location access is denied or fails.
        }
      );
    } else {
      setGeolocationError("Geolocation is not supported by this browser.");
    }
  }, []); // Run once on mount to get user's location

  useEffect(() => {
    if (mapRef.current && userLocation) {
      const userIcon = L.divIcon({
        html: ReactDOMServer.renderToString(
          <div style={{
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            padding: '5px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            width: '28px',
            height: '28px',
            border: '2px solid hsl(var(--primary-foreground))'
          }}>
            <Home size={16} />
          </div>
        ),
        className: 'custom-user-marker-icon', // Can add specific CSS if needed
        iconSize: [28, 28],
        iconAnchor: [14, 14], // Center the icon
        popupAnchor: [0, -14]
      });

      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLatLng(userLocation);
      } else {
        userLocationMarkerRef.current = L.marker(userLocation, { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup("Your current location");
      }
      // Optionally, pan to user's location when first found
      // mapRef.current.panTo(userLocation);
    }
  }, [userLocation]);


  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) {
      return;
    }
    markersLayerRef.current.clearLayers();
    posts.forEach(post => {
      if (post.coordinates) {
        const marker = L.marker([post.coordinates.latitude, post.coordinates.longitude], {
          icon: createCustomIcon(post.category || 'other'),
        });
        
        const popupElement = L.DomUtil.create('div', 'custom-leaflet-popup p-1 min-w-[180px]');
        
        if (post.images && post.images.length > 0) {
          const imgEl = L.DomUtil.create('img', '', popupElement);
          imgEl.src = post.images[0];
          imgEl.alt = post.title;
          imgEl.style.width = '100%';
          imgEl.style.maxHeight = '80px';
          imgEl.style.objectFit = 'cover';
          imgEl.style.borderRadius = '4px';
          imgEl.style.marginBottom = '4px';
        }
        
        const titleEl = L.DomUtil.create('h3', 'font-bold text-sm mb-0.5', popupElement);
        titleEl.innerText = post.title;

        const description = post.description.length > 70 ? post.description.substring(0, 70) + '...' : post.description;
        const descEl = L.DomUtil.create('p', 'text-xs text-muted-foreground mb-1.5', popupElement);
        descEl.innerText = description;

        if (onPostClick) {
          const buttonEl = L.DomUtil.create('button', 'text-primary text-xs hover:underline font-medium', popupElement);
          buttonEl.innerText = 'View Details →';
          L.DomEvent.on(buttonEl, 'click', (e) => {
            L.DomEvent.stopPropagation(e); 
            onPostClick(post.id);
          });
        }

        if (userLocation && post.coordinates) {
          const directionsButtonEl = L.DomUtil.create('button', 'text-accent text-xs hover:underline font-medium mt-1.5 block w-full text-left', popupElement);
          directionsButtonEl.innerText = 'Get Directions ↗';
          L.DomEvent.on(directionsButtonEl, 'click', (e) => {
            L.DomEvent.stopPropagation(e);
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${post.coordinates.latitude},${post.coordinates.longitude}&travelmode=driving`;
            window.open(mapsUrl, '_blank');
          });
        }
        
        marker.bindPopup(popupElement, {
          closeButton: true,
          minWidth: 180, 
        });
        
        markersLayerRef.current?.addLayer(marker);
      }
    });
  }, [posts, onPostClick, userLocation]); // Add userLocation to dependency array for directions link

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
      
      const targetZoom = onMapClick ? 13 : mapRef.current.getZoom();
      mapRef.current.setView(selectedLocation, targetZoom);
    }
  }, [selectedLocation, onMapClick]);

  return (
    <>
      <div ref={mapContainerRef} className={cn('bg-muted rounded-lg shadow-md overflow-hidden', className)} />
      {geolocationError && (
        <p className="text-xs text-destructive mt-1 text-center">{geolocationError}</p>
      )}
    </>
  );
}

