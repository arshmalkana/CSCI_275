import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Locate } from 'lucide-react'

// Fix for default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapPickerProps {
  latitude: string
  longitude: string
  title: string
  onLocationSelect: (lat: number, lng: number) => void
  error?: string
}

function LocationMarker({ position, onPositionChange }: {
  position: [number, number] | null
  onPositionChange: (lat: number, lng: number) => void
}) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position)

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setMarkerPosition([lat, lng])
      onPositionChange(lat, lng)
    },
  })

  useEffect(() => {
    if (position && markerPosition === null) {
      setMarkerPosition(position)
      map.setView(position, map.getZoom())
    }
  }, [position, map, markerPosition])

  return markerPosition === null ? null : (
    <Marker
      position={markerPosition}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          setMarkerPosition([position.lat, position.lng])
          onPositionChange(position.lat, position.lng)
        },
      }}
    />
  )
}

export function MapPicker({ latitude, longitude, title, onLocationSelect, error }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Try to use provided lat/lng
    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng])
        return
      }
    }
  }, [latitude, longitude])

  const handleGetCurrentLocation = () => {
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPosition([latitude, longitude])
        onLocationSelect(latitude, longitude)
        setIsLocating(false)
        setIsExpanded(true)
      },
      (error) => {
        console.error('Error getting location:', error)
        // Default to Punjab, India center if location access denied
        const defaultPosition: [number, number] = [30.7333, 76.7794]
        setPosition(defaultPosition)
        onLocationSelect(defaultPosition[0], defaultPosition[1])
        setIsLocating(false)
        setIsExpanded(true)
        alert('Unable to get your exact location. Showing Punjab center. You can drag the marker to adjust.')
      }
    )
  }

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng])
    onLocationSelect(lat, lng)
  }

  const handleSelectOnMap = () => {
    if (!position) {
      handleGetCurrentLocation()
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div>
      <div className={`bg-gradient-to-br from-blue-50 to-cyan-50 border rounded-lg overflow-hidden ${
        error ? 'border-red-300' : 'border-blue-200'
      }`}>
        {/* Header - Always Visible */}
        <div
          className="p-4 cursor-pointer hover:bg-blue-100/50 transition-colors"
          onClick={handleSelectOnMap}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 font-['Poppins']">{title}</h3>
                {position ? (
                  <p className="text-xs text-gray-600 font-['Poppins'] mt-0.5">
                    {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 font-['Poppins'] mt-0.5">
                    Tap to select location on map
                  </p>
                )}
              </div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className={`text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

      {/* Map Container - Expandable */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ overflow: 'hidden' }}
      >
        <div className="border-t border-blue-200">
          {isLocating ? (
            <div className="h-80 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="text-center px-6">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-yellow-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-700 font-['Poppins'] font-medium">Getting your location...</p>
                <p className="text-sm text-gray-500 font-['Poppins'] mt-2">This may take a few seconds</p>
              </div>
            </div>
          ) : position ? (
            <div className="relative h-80">
              <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} onPositionChange={handlePositionChange} />
              </MapContainer>

              {/* Floating Current Location Button */}
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 active:bg-gray-100 shadow-lg rounded-full p-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Get current location"
              >
                <Locate size={18} className={`text-yellow-600 ${isLocating ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          ) : null}

          {/* Footer with instructions */}
          {position && (
            <div className="p-3 bg-blue-50 border-t border-blue-200">
              <p className="text-xs text-gray-600 font-['Poppins'] text-center">
                Tap map or drag marker to adjust location • Tap header to collapse
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
      {error && (
        <p className="text-xs text-red-600 font-['Poppins'] mt-1 ml-1">{error}</p>
      )}
    </div>
  )
}
