import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom bird icon for rare bird sightings
const birdIcon = new L.Icon({
  iconUrl: '/bird-marker.svg',
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48],
})

// Custom hotspot icon for birding locations
const hotspotIcon = new L.Icon({
  iconUrl: '/hotspot-marker.svg',
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -44],
})

// User location icon
const userIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export interface BirdSighting {
  species: string
  scientific_name?: string
  location: string
  date: string
  count: number | string
  lat: number
  lng: number
}

export interface Hotspot {
  name: string
  hotspot_id?: string
  lat: number
  lng: number
  species_count?: number
  country?: string
  region?: string
}

interface WikipediaInfo {
  image?: string
  description?: string
  url?: string
}

interface MigrationInfo {
  migration_info?: string
  species?: string
}

// Cache for Wikipedia and migration data to avoid repeated API calls
const wikiCache: Record<string, WikipediaInfo> = {}
const migrationCache: Record<string, MigrationInfo> = {}

// Component to fetch and display bird info from Wikipedia and migration data
function BirdPopupContent({ bird, userLocation }: { bird: BirdSighting; userLocation?: { lat: number; lng: number } }) {
  const [wikiInfo, setWikiInfo] = useState<WikipediaInfo | null>(null)
  const [migrationInfo, setMigrationInfo] = useState<MigrationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrationLoading, setMigrationLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showMigration, setShowMigration] = useState(false)

  useEffect(() => {
    const fetchWikipediaInfo = async () => {
      // Use scientific name for more accurate results, fallback to common name
      const searchTerm = bird.scientific_name || bird.species
      
      // Check cache first
      if (wikiCache[searchTerm]) {
        setWikiInfo(wikiCache[searchTerm])
        setLoading(false)
        return
      }

      try {
        // Use Wikipedia's REST API to get page summary with image
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`,
          { headers: { 'Accept': 'application/json' } }
        )

        if (!response.ok) {
          // Try with common name if scientific name failed
          if (bird.scientific_name && bird.species) {
            const fallbackResponse = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bird.species)}`,
              { headers: { 'Accept': 'application/json' } }
            )
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json()
              const info: WikipediaInfo = {
                image: data.thumbnail?.source,
                description: data.extract,
                url: data.content_urls?.desktop?.page
              }
              wikiCache[searchTerm] = info
              setWikiInfo(info)
              setLoading(false)
              return
            }
          }
          throw new Error('Not found')
        }

        const data = await response.json()
        const info: WikipediaInfo = {
          image: data.thumbnail?.source,
          description: data.extract,
          url: data.content_urls?.desktop?.page
        }
        
        // Cache the result
        wikiCache[searchTerm] = info
        setWikiInfo(info)
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchWikipediaInfo()
  }, [bird.species, bird.scientific_name])

  // Fetch migration info when user clicks to expand
  const fetchMigrationInfo = async () => {
    if (migrationInfo || !showMigration) return
    
    const cacheKey = `${bird.species}-${userLocation?.lat || bird.lat}-${userLocation?.lng || bird.lng}`
    
    // Check cache first
    if (migrationCache[cacheKey]) {
      setMigrationInfo(migrationCache[cacheKey])
      setMigrationLoading(false)
      return
    }

    setMigrationLoading(true)
    try {
      const lat = userLocation?.lat || bird.lat
      const lng = userLocation?.lng || bird.lng
      const response = await fetch(`/api/migration/species-info?species=${encodeURIComponent(bird.species)}&lat=${lat}&lng=${lng}`)
      
      if (response.ok) {
        const data = await response.json()
        migrationCache[cacheKey] = data
        setMigrationInfo(data)
      }
    } catch (err) {
      console.error('Error fetching migration info:', err)
    } finally {
      setMigrationLoading(false)
    }
  }

  useEffect(() => {
    if (showMigration && !migrationInfo) {
      fetchMigrationInfo()
    }
  }, [showMigration])

  // Truncate description to ~2 sentences
  const truncatedDescription = useMemo(() => {
    if (!wikiInfo?.description) return null
    
    // Split by sentence endings
    const sentences = wikiInfo.description.match(/[^.!?]+[.!?]+/g) || []
    if (sentences.length <= 2) return wikiInfo.description
    
    return sentences.slice(0, 2).join(' ').trim()
  }, [wikiInfo?.description])

  return (
    <div className="w-[360px] max-h-[70vh] overflow-y-auto">
      {/* Compact layout with image on left */}
      <div className="flex gap-3 mb-2">
        {/* Bird Image - smaller and on the side */}
        {loading ? (
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : wikiInfo?.image ? (
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={wikiInfo.image}
              alt={bird.species}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl flex items-center justify-center w-full h-full">🐦</span>'
              }}
            />
          </div>
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex-shrink-0 flex items-center justify-center">
            <span className="text-2xl">🐦</span>
          </div>
        )}

        {/* Bird Name & Basic Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-red-600 text-base leading-tight">{bird.species}</h3>
          {bird.scientific_name && (
            <p className="text-gray-500 text-xs italic">{bird.scientific_name}</p>
          )}
          <div className="mt-1 text-xs text-gray-600">
            <p>Count: {bird.count}</p>
            <p className="truncate">{bird.location}</p>
          </div>
        </div>
      </div>

      {/* Wikipedia Description - compact */}
      {!loading && !error && truncatedDescription && (
        <p className="text-gray-700 text-xs mb-2 leading-relaxed line-clamp-3">
          {truncatedDescription}
        </p>
      )}

      {/* Migration Info Toggle */}
      <div className="border-t border-gray-200 pt-2 mt-2">
        <button
          onClick={() => setShowMigration(!showMigration)}
          className="w-full text-left text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          <span className="inline-block transform transition-transform duration-200" style={{ transform: showMigration ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          Migration & Timing Info
        </button>
        
        {showMigration && (
          <div className="mt-2 bg-teal-50 rounded-lg p-3 text-xs max-h-[300px] overflow-y-auto">
            {migrationLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-teal-600">Loading migration data...</span>
              </div>
            ) : migrationInfo?.migration_info ? (
              <div className="text-gray-700 prose prose-xs max-w-none leading-relaxed">
                <div className="whitespace-pre-wrap text-xs leading-5">{migrationInfo.migration_info}</div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Migration info unavailable</p>
            )}
          </div>
        )}
      </div>

      {/* Date & Links row */}
      <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-2 mt-2">
        <span className="text-gray-500">{bird.date}</span>
        <div className="flex gap-2">
          {wikiInfo?.url && (
            <a href={wikiInfo.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
              Wiki
            </a>
          )}
          <a
            href={`https://ebird.org/species/${bird.species.toLowerCase().replace(/\s+/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            eBird
          </a>
        </div>
      </div>
    </div>
  )
}

interface BirdMapProps {
  center: [number, number]
  zoom?: number
  birds?: BirdSighting[]
  hotspots?: Hotspot[]
  showUserLocation?: boolean
  userLocation?: { lat: number; lng: number }
  height?: string
  className?: string
}

// Component to recenter map when center changes
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  
  return null
}

// Component to fit bounds to all markers
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [points, map])
  
  return null
}

export default function BirdMap({
  center,
  zoom = 11,
  birds = [],
  hotspots = [],
  showUserLocation = true,
  userLocation,
  height = '400px',
  className = '',
}: BirdMapProps) {
  // Calculate all points for fitting bounds
  const allPoints = useMemo(() => {
    const points: [number, number][] = []
    
    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng])
    }
    
    birds.forEach(bird => {
      if (bird.lat && bird.lng) {
        points.push([bird.lat, bird.lng])
      }
    })
    
    hotspots.forEach(hs => {
      if (hs.lat && hs.lng) {
        points.push([hs.lat, hs.lng])
      }
    })
    
    return points
  }, [userLocation, birds, hotspots])

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapRecenter center={center} />
        
        {allPoints.length > 1 && <FitBounds points={allPoints} />}
        
        {/* User location marker */}
        {showUserLocation && userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <strong className="text-blue-600">Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Bird sighting markers with enhanced popups */}
        {birds.map((bird, index) => (
          bird.lat && bird.lng && (
            <Marker
              key={`bird-${index}-${bird.lat}-${bird.lng}`}
              position={[bird.lat, bird.lng]}
              icon={birdIcon}
            >
              <Popup 
                maxWidth={400}
                maxHeight={500}
                autoPan={true}
                autoPanPadding={L.point(40, 40)}
                keepInView={true}
              >
                <BirdPopupContent bird={bird} userLocation={userLocation} />
              </Popup>
            </Marker>
          )
        ))}
        
        {/* Hotspot markers */}
        {hotspots.map((hotspot, index) => (
          hotspot.lat && hotspot.lng && (
            <Marker
              key={`hotspot-${index}-${hotspot.hotspot_id || hotspot.lat}`}
              position={[hotspot.lat, hotspot.lng]}
              icon={hotspotIcon}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h3 className="font-bold text-green-600 text-lg mb-1">{hotspot.name}</h3>
                  <div className="space-y-1 text-sm">
                    {hotspot.species_count !== undefined && (
                      <p><span className="font-medium">Species:</span> {hotspot.species_count}</p>
                    )}
                    {hotspot.region && (
                      <p><span className="font-medium">Region:</span> {hotspot.region}</p>
                    )}
                    {hotspot.hotspot_id && (
                      <a
                        href={`https://ebird.org/hotspot/${hotspot.hotspot_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 underline block mt-2"
                      >
                        View on eBird
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  )
}
