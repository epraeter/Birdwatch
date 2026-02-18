import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { findBirdingTours, type BirdingTour } from '../lib/api'
import { useUserLocation } from '../hooks/useUserLocation'

export default function CommunityPage() {
  const { getLocation: getUserLocation, loading: geoLoading, error: geoError, clearError: clearGeoError } = useUserLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [tours, setTours] = useState<BirdingTour[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState<string>('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [zipCode, setZipCode] = useState('')
  const [countryCode, setCountryCode] = useState('us')

  const lookupZipCode = async () => {
    if (!zipCode.trim()) {
      setLocationError('Please enter a zip code')
      return
    }

    setLocationLoading(true)
    setLocationError(null)

    try {
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
      setLocationError('Could not find that zip code. Please try again.')
      setLocation(null)
      setLocationName('')
    } finally {
      setLocationLoading(false)
    }
  }

  const handleUseMyLocation = async () => {
    const result = await getUserLocation()
    if (result) {
      setLocation({ lat: result.lat, lng: result.lng })
      setLocationName(result.locationName)
      setLocationError(null)
    }
  }

  const handleFindTours = async () => {
    if (!locationName?.trim() && !location) return
    const searchLocation = locationName?.trim() || (location ? `${location.lat},${location.lng}` : '')
    if (!searchLocation) return
    setIsLoading(true)
    setTours([])
    try {
      const response = await findBirdingTours(searchLocation)
      setTours(response.tours || [])
    } catch (error) {
      console.error('Error:', error)
      setTours([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <UserGroupIcon className="w-4 h-4" />
          Birding Tours Agent
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Birding Community
        </h1>
        <p className="text-gray-600">
          Find local birding tours and guided walks
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="agent-card p-6"
        >
          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Birding Tours & Walks
              </h3>

              <form onSubmit={(e) => { e.preventDefault(); lookupZipCode(); }}>
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
                    placeholder="Zip code"
                    className="input-field flex-1"
                  />
                  <button
                    type="submit"
                    disabled={locationLoading || !zipCode.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {locationLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MapPinIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 my-2">
                  <span className="text-xs text-gray-500">or</span>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={geoLoading}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                  >
                    {geoLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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

                {location && locationName && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-2">
                    <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{locationName}</span>
                  </div>
                )}

                {(locationError || geoError) && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-2">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{locationError || geoError}</span>
                  </div>
                )}
              </form>

              <button
                onClick={handleFindTours}
                disabled={(!location && !locationName?.trim()) || isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finding tours...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    Find Tours & Walks
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Discover local birding tours, guided walks, and Audubon field trips
              </p>
            </div>

          {/* Quick Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Birding Resources</h4>
            <div className="space-y-2">
              <a
                href="https://ebird.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-indigo-600 hover:text-indigo-700"
              >
                eBird - Report Sightings
              </a>
              <a
                href="https://www.allaboutbirds.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-indigo-600 hover:text-indigo-700"
              >
                All About Birds - Cornell Lab
              </a>
              <a
                href="https://www.audubon.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-indigo-600 hover:text-indigo-700"
              >
                National Audubon Society
              </a>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="agent-card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-indigo-600" />
              Birding Tours & Walks
            </h3>

            {tours.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 overflow-y-auto max-h-[60vh] pr-2">
                    {tours.map((tour, i) => (
                      <motion.a
                        key={tour.url + i}
                        href={tour.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="block p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group"
                      >
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {tour.title}
                        </h4>
                        <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{tour.location}</span>
                        </div>
                        {tour.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{tour.description}</p>
                        )}
                        <div className="mt-3 flex items-center gap-1 text-indigo-600 text-sm font-medium">
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          View page
                        </div>
                      </motion.a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Set your location and click &quot;Find Tours & Walks&quot; to discover local birding tours
                    </p>
                  </div>
                )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
