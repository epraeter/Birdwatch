import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  MapIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import { getLocationRecommendations, getRareBirds, createBirdingRoute, getNearbyHotspots } from '../lib/api'
import { useUserLocation } from '../hooks/useUserLocation'
import BirdMap, { BirdSighting, Hotspot } from '../components/BirdMap'

export default function LocationsPage() {
  const { getLocation: getUserLocation, loading: geoLoading, error: geoError, clearError: clearGeoError } = useUserLocation()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState<string>('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [zipCode, setZipCode] = useState('')
  const [countryCode, setCountryCode] = useState('us')
  const [targetSpecies, setTargetSpecies] = useState('')
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [maxDistance, setMaxDistance] = useState(50)
  const [duration, setDuration] = useState(4)
  const [recommendations, setRecommendations] = useState<string | null>(null)
  const [rareBirds, setRareBirds] = useState<BirdSighting[]>([])
  const [rareBirdsMarkdown, setRareBirdsMarkdown] = useState<string | null>(null)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [route, setRoute] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'recommend' | 'rare' | 'route'>('recommend')
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  const lookupZipCode = async () => {
    if (!zipCode.trim()) {
      setLocationError('Please enter a zip code')
      return
    }

    setLocationLoading(true)
    setLocationError(null)

    try {
      // Use Zippopotam.us API (free, no API key required)
      const response = await fetch(`https://api.zippopotam.us/${countryCode}/${zipCode.trim()}`)
      
      if (!response.ok) {
        throw new Error('Zip code not found')
      }

      const data = await response.json()
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0]
        setLocation({
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
        })
        setLocationName(`${place['place name']}, ${place['state abbreviation'] || data.country}`)
        setLocationError(null)
        clearGeoError()
      } else {
        throw new Error('No location data found')
      }
    } catch (error) {
      setLocationError('Could not find that zip code. Please check and try again.')
      setLocation(null)
      setLocationName('')
    } finally {
      setLocationLoading(false)
    }
  }

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    lookupZipCode()
  }

  const handleUseMyLocation = async () => {
    const result = await getUserLocation()
    if (result) {
      setLocation({ lat: result.lat, lng: result.lng })
      setLocationName(result.locationName)
      setLocationError(null)
    }
  }

  const handleGetRecommendations = async () => {
    if (!location) return
    setIsLoading(true)
    try {
      // Get both recommendations and hotspots
      const [recResponse, hotspotsResponse] = await Promise.all([
        getLocationRecommendations({
          latitude: location.lat,
          longitude: location.lng,
          target_species: targetSpecies ? targetSpecies.split(',').map(s => s.trim()) : undefined,
          skill_level: skillLevel,
          max_distance_km: maxDistance,
          duration_hours: duration,
        }),
        getNearbyHotspots(location.lat, location.lng, maxDistance)
      ])
      
      setRecommendations(recResponse.recommendations)
      setHotspots(hotspotsResponse.hotspots || [])
    } catch (error) {
      console.error('Error:', error)
      setRecommendations('Error fetching recommendations. Please try again.')
      setHotspots([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetRareBirds = async () => {
    if (!location) return
    setIsLoading(true)
    try {
      const response = await getRareBirds(location.lat, location.lng, maxDistance, 7)
      setRareBirdsMarkdown(response.rare_birds)
      setRareBirds(response.birds || [])
    } catch (error) {
      console.error('Error:', error)
      setRareBirdsMarkdown('Error fetching rare birds. Please try again.')
      setRareBirds([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoute = async () => {
    if (!location) return
    setIsLoading(true)
    try {
      const response = await createBirdingRoute({
        latitude: location.lat,
        longitude: location.lng,
        target_species: targetSpecies ? targetSpecies.split(',').map(s => s.trim()) : undefined,
        skill_level: skillLevel,
        max_distance_km: maxDistance,
        duration_hours: duration,
      })
      setRoute(response.route)
    } catch (error) {
      console.error('Error:', error)
      setRoute('Error creating route. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'recommend', label: 'Hotspots', action: handleGetRecommendations },
    { id: 'rare', label: 'Rare Birds', action: handleGetRareBirds },
    { id: 'route', label: 'Create Route', action: handleCreateRoute },
  ]

  const hasMapData = (activeTab === 'recommend' && hotspots.length > 0) || 
                     (activeTab === 'rare' && rareBirds.length > 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <MapPinIcon className="w-4 h-4" />
          Location Scout Agent
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Birding Locations
        </h1>
        <p className="text-gray-600">
          Discover hotspots, rare bird alerts, and create personalized birding routes
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="agent-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Options</h3>

          {/* Zip Code Input */}
          <form onSubmit={handleZipSubmit} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Location
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="input-field w-20 text-sm"
              >
                <option value="us">US</option>
                <option value="ca">CA</option>
                <option value="gb">UK</option>
                <option value="de">DE</option>
                <option value="fr">FR</option>
                <option value="au">AU</option>
              </select>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter zip code"
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={locationLoading || !zipCode.trim()}
                className="px-4 py-2 bg-forest-600 text-white rounded-xl hover:bg-forest-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {locationLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MapPinIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Use my location */}
            <div className="flex items-center gap-2 my-2">
              <span className="text-xs text-gray-500">or</span>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className="flex items-center gap-1.5 text-sm text-forest-600 hover:text-forest-700 font-medium disabled:opacity-50"
              >
                {geoLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPinIcon className="w-4 h-4" />
                    Use my location
                  </>
                )}
              </button>
            </div>

            {/* Location Result */}
            {location && locationName && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                <span>{locationName}</span>
              </div>
            )}

            {(locationError || geoError) && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <span>{locationError || geoError}</span>
              </div>
            )}
          </form>

          {/* Target Species */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Species (optional)
            </label>
            <input
              type="text"
              value={targetSpecies}
              onChange={(e) => setTargetSpecies(e.target.value)}
              placeholder="e.g., Bald Eagle, Great Blue Heron"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
          </div>

          {/* Skill Level */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Level
            </label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as typeof skillLevel)}
              className="input-field"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Max Distance */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Distance: {maxDistance} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time: {duration} hours
            </label>
            <input
              type="range"
              min="1"
              max="12"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-forest-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={tabs.find(t => t.id === activeTab)?.action}
            disabled={!location || isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-5 h-5" />
                {activeTab === 'recommend' && 'Find Hotspots'}
                {activeTab === 'rare' && 'Find Rare Birds'}
                {activeTab === 'route' && 'Create Route'}
              </>
            )}
          </button>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* View Toggle */}
          {hasMapData && (
            <div className="flex justify-end">
              <div className="inline-flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'map'
                      ? 'bg-white text-forest-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  Map
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-forest-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                  List
                </button>
              </div>
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && hasMapData && location && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="agent-card overflow-hidden"
            >
              <BirdMap
                center={[location.lat, location.lng]}
                zoom={10}
                birds={activeTab === 'rare' ? rareBirds : []}
                hotspots={activeTab === 'recommend' ? hotspots : []}
                userLocation={location}
                height="calc(100vh - 320px)"
              />
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {activeTab === 'recommend' && `${hotspots.length} hotspots found`}
                    {activeTab === 'rare' && `${rareBirds.length} rare bird sightings`}
                  </span>
                  <span className="text-xs">Click markers for details & migration info</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* List/Content View */}
          {(viewMode === 'list' || !hasMapData) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="agent-card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-orange-600" />
                {activeTab === 'recommend' && 'Location Recommendations'}
                {activeTab === 'rare' && 'Rare Bird Alerts'}
                {activeTab === 'route' && 'Your Birding Route'}
              </h3>

              <div className="markdown-content prose prose-sm max-w-none overflow-y-auto max-h-[60vh]">
                {activeTab === 'recommend' && recommendations && (
                  <ReactMarkdown>{recommendations}</ReactMarkdown>
                )}
                {activeTab === 'rare' && rareBirdsMarkdown && (
                  <ReactMarkdown>{String(rareBirdsMarkdown)}</ReactMarkdown>
                )}
                {activeTab === 'route' && route && (
                  <ReactMarkdown>{route}</ReactMarkdown>
                )}
                {!recommendations && !rareBirdsMarkdown && !route && (
                  <div className="text-center py-12">
                    <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Select an option and search to see results
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
