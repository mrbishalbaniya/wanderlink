
'use client';

import { useEffect, useRef, useState } from 'react';
import type { LatLng, LatLngTuple, Map as LeafletMapInstance } from 'leaflet'; 
import L from 'leaflet'; 
import 'leaflet.markercluster'; 
import type { Post, PostCategory } from '@/types';
import { Mountain, Building2, Waves, Utensils, Landmark, Trees, MapPin as OtherPinIcon, Home, Route as RouteIcon, ExternalLink, Pin } from 'lucide-react'; // Added Pin
import ReactDOMServer from 'react-dom/server';
import { cn } from '@/lib/utils';

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
  const routeLineRef = useRef<L.Polyline | null>(null);

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

    newMap.on('popupclose', () => {
        if (routeLineRef.current && mapRef.current?.hasLayer(routeLineRef.current)) {
            mapRef.current.removeLayer(routeLineRef.current);
            routeLineRef.current = null;
        }
    });

    if (onMapClick) {
      newMap.on('click', (e: L.LeafletMouseEvent) => {
        if (routeLineRef.current && mapRef.current?.hasLayer(routeLineRef.current)) {
            mapRef.current.removeLayer(routeLineRef.current);
            routeLineRef.current = null;
        }
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
      if (routeLineRef.current) routeLineRef.current = null;
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
        }
      );
    } else {
      setGeolocationError("Geolocation is not supported by this browser.");
    }
  }, []);

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
        className: 'custom-user-marker-icon', 
        iconSize: [28, 28],
        iconAnchor: [14, 14], 
        popupAnchor: [0, -14]
      });

      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLatLng(userLocation);
      } else {
        userLocationMarkerRef.current = L.marker(userLocation, { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup("Your current location");
      }
    }
  }, [userLocation]);


  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) {
      return;
    }
    markersLayerRef.current.clearLayers();
    
    if (routeLineRef.current && mapRef.current.hasLayer(routeLineRef.current)) {
        mapRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
    }

    posts.forEach(post => {
      if (post.coordinates) {
        const marker = L.marker([post.coordinates.latitude, post.coordinates.longitude], {
          icon: createCustomIcon(post.category || 'other'),
        });
        
        const popupElement = L.DomUtil.create('div', 'custom-leaflet-popup p-2 min-w-[220px] space-y-2');
        
        if (post.images && post.images.length > 0) {
          const imgEl = L.DomUtil.create('img', '', popupElement);
          imgEl.src = post.images[0];
          imgEl.alt = post.title;
          imgEl.style.width = '100%';
          imgEl.style.maxHeight = '100px';
          imgEl.style.objectFit = 'cover';
          imgEl.style.borderRadius = '4px';
          imgEl.style.marginBottom = '6px';
        }
        
        const titleEl = L.DomUtil.create('h3', 'font-bold text-base mb-0.5', popupElement);
        titleEl.innerText = post.title;

        if (post.locationLabel) {
            const locationLabelEl = L.DomUtil.create('p', 'text-xs text-muted-foreground mb-0.5 flex items-center', popupElement);
            locationLabelEl.innerHTML = ReactDOMServer.renderToString(<Pin className="h-3 w-3 mr-1 text-accent" />) + post.locationLabel;
        }

        const captionText = post.caption.length > 70 ? post.caption.substring(0, 70) + '...' : post.caption;
        const descEl = L.DomUtil.create('p', 'text-xs text-muted-foreground mb-1.5', popupElement);
        descEl.innerText = captionText;

        const buttonsContainer = L.DomUtil.create('div', 'flex flex-col space-y-1.5 mt-2 pt-1.5 border-t border-border/50', popupElement);

        if (userLocation && post.coordinates) {
          const showRouteButtonEl = L.DomUtil.create('button', 'flex items-center justify-center text-xs text-accent hover:text-accent/80 font-medium p-1.5 rounded-md border border-accent/50 hover:bg-accent/10 w-full transition-colors', buttonsContainer);
          showRouteButtonEl.innerHTML = ReactDOMServer.renderToString(<RouteIcon className="h-4 w-4 mr-1.5" />) + 'Show Route on Map';
          L.DomEvent.on(showRouteButtonEl, 'click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (mapRef.current) {
              if (routeLineRef.current && mapRef.current.hasLayer(routeLineRef.current)) {
                mapRef.current.removeLayer(routeLineRef.current);
                routeLineRef.current = null;
              }
              if (userLocation && post.coordinates) {
                const newRouteLine = L.polyline(
                  [userLocation, [post.coordinates.latitude, post.coordinates.longitude]],
                  { color: 'hsl(var(--accent))', weight: 4, opacity: 0.8, dashArray: '5, 5' }
                ).addTo(mapRef.current);
                routeLineRef.current = newRouteLine;
                mapRef.current.fitBounds(L.latLngBounds(userLocation, [post.coordinates.latitude, post.coordinates.longitude]), { padding: [50, 50] });
              }
            }
          });
        }
        
        const openInGMapsButtonEl = L.DomUtil.create('button', 'flex items-center justify-center text-xs text-primary hover:text-primary/80 font-medium p-1.5 rounded-md border border-primary/50 hover:bg-primary/10 w-full transition-colors', buttonsContainer);
        openInGMapsButtonEl.innerHTML = ReactDOMServer.renderToString(<ExternalLink className="h-4 w-4 mr-1.5" />) + 'Open in Google Maps';
        L.DomEvent.on(openInGMapsButtonEl, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          let mapsUrl = `https://www.google.com/maps/search/?api=1&query=${post.coordinates.latitude},${post.coordinates.longitude}`;
          if (userLocation) {
             mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${post.coordinates.latitude},${post.coordinates.longitude}&travelmode=driving`;
          }
          window.open(mapsUrl, '_blank');
        });

        if (onPostClick) {
          const buttonEl = L.DomUtil.create('button', 'flex items-center justify-center text-xs text-foreground/80 hover:text-foreground font-medium p-1.5 rounded-md border border-border hover:bg-muted w-full transition-colors', buttonsContainer);
          buttonEl.innerText = 'View Full Details →';
          L.DomEvent.on(buttonEl, 'click', (e) => {
            L.DomEvent.stopPropagation(e); 
            if (mapRef.current) mapRef.current.closePopup(); 
            onPostClick(post.id);
          });
        }
        
        marker.bindPopup(popupElement, {
          closeButton: true,
          minWidth: 220, 
        });
        
        markersLayerRef.current?.addLayer(marker);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, onPostClick, userLocation]);

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
        .bindPopup('Selected Location. Drag to adjust.'); 
      
      newSelectedMarker.on('dragend', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        if(onMapClick) onMapClick(position);
      });
      
      selectedMarkerRef.current = newSelectedMarker;
      
      const targetZoom = onMapClick ? 13 : (mapRef.current.getZoom() < 5 ? 13 : mapRef.current.getZoom());
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
