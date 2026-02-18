import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  ListBulletIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  MapPinIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useLifeListStore } from '../store/lifeListStore'
import BirdAutocomplete from '../components/BirdAutocomplete'
import BirdRecommendationCard, { type BirdRecommendation } from '../components/BirdRecommendationCard'
import { getAreaBasedTargets } from '../lib/api'
import { useUserLocation } from '../hooks/useUserLocation'

type SortField = 'dateAdded' | 'species'
type SortDirection = 'asc' | 'desc'

export default function LifeListPage() {
  const { entries, addEntry, removeEntry, hasSpecies, getStats } = useLifeListStore()
  const stats = getStats()

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('dateAdded')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Add form state
  const [newSpecies, setNewSpecies] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)

  // Area-based recommendations
  const [areaBirds, setAreaBirds] = useState<BirdRecommendation[]>([])
  const [areaFallbackText, setAreaFallbackText] = useState<string | null>(null)
  const [areaLoading, setAreaLoading] = useState(false)
  const [areaError, setAreaError] = useState<string | null>(null)
  const [recZipCode, setRecZipCode] = useState('')
  const [recCountryCode, setRecCountryCode] = useState('us')
  const [recLocation, setRecLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [recLocationName, setRecLocationName] = useState<string>('')
  const [recLocationLoading, setRecLocationLoading] = useState(false)
  const [recLocationError, setRecLocationError] = useState<string | null>(null)
  const { getLocation: getUserLocation, loading: geoLoading, error: geoError, clearError: clearGeoError } = useUserLocation()

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = [...entries]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.species.toLowerCase().includes(query) ||
          e.location?.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'dateAdded') {
        comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
      } else if (sortField === 'species') {
        comparison = a.species.localeCompare(b.species)
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })

    return result
  }, [entries, searchQuery, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleAddSpecies = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAddSuccess(false)

    if (!newSpecies.trim()) {
      setAddError('Please enter a species name')
      return
    }

    if (hasSpecies(newSpecies)) {
      setAddError(`${newSpecies} is already on your life list!`)
      return
    }

    addEntry({
      species: newSpecies.trim(),
      location: newLocation.trim() || undefined,
      notes: newNotes.trim() || undefined,
    })

    setAddSuccess(true)
    setNewSpecies('')
    setNewLocation('')
    setNewNotes('')

    // Close modal after brief success message
    setTimeout(() => {
      setShowAddModal(false)
      setAddSuccess(false)
    }, 1500)
  }

  const handleDelete = (id: string) => {
    removeEntry(id)
    setDeleteConfirm(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const lookupRecZipCode = async () => {
    if (!recZipCode.trim()) {
      setRecLocation(null)
      setRecLocationName('')
      setRecLocationError(null)
      return
    }
    setRecLocationLoading(true)
    setRecLocationError(null)
    clearGeoError()
    try {
      const res = await fetch(`https://api.zippopotam.us/${recCountryCode}/${recZipCode.trim()}`)
      if (!res.ok) throw new Error('Zip code not found')
      const data = await res.json()
      if (data.places?.[0]) {
        const place = data.places[0]
        setRecLocation({
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
        })
        setRecLocationName(`${place['place name']}, ${place['state abbreviation'] || data.country}`)
      } else throw new Error('No location data')
    } catch {
      setRecLocationError('Could not find that zip code')
      setRecLocation(null)
    } finally {
      setRecLocationLoading(false)
    }
  }

  const handleUseMyLocation = async () => {
    const result = await getUserLocation()
    if (result) {
      setRecLocation({ lat: result.lat, lng: result.lng })
      setRecLocationName(result.locationName)
      setRecLocationError(null)
    }
  }

  const handleGetAreaRecommendations = async () => {
    const species = entries.map((e) => e.species)
    if (species.length === 0) return
    setAreaLoading(true)
    setAreaError(null)
    setAreaBirds([])
    setAreaFallbackText(null)
    try {
      const res = await getAreaBasedTargets(species, {
        numTargets: 3,
        lat: recLocation?.lat,
        lng: recLocation?.lng,
      })
      if (res.birds && res.birds.length > 0) {
        setAreaBirds(res.birds)
      } else if (res.recommendations) {
        setAreaFallbackText(res.recommendations)
      }
    } catch (err) {
      setAreaError(err instanceof Error ? err.message : 'Failed to get recommendations')
    } finally {
      setAreaLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <ListBulletIcon className="w-4 h-4" />
          Life List
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Life List</h1>
        <p className="text-gray-600">
          Track every unique species you've ever seen
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-5 shadow-lg">
          <ChartBarIcon className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-3xl font-bold">{stats.totalSpecies}</div>
          <div className="text-sm text-white/80">Total Species</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <CalendarIcon className="w-8 h-8 mb-2 text-green-500" />
          <div className="text-3xl font-bold text-gray-900">{stats.thisYear}</div>
          <div className="text-sm text-gray-500">This Year</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <CalendarIcon className="w-8 h-8 mb-2 text-blue-500" />
          <div className="text-3xl font-bold text-gray-900">{stats.thisMonth}</div>
          <div className="text-sm text-gray-500">This Month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SparklesIcon className="w-8 h-8 mb-2 text-purple-500" />
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalSpecies >= 100 ? Math.floor(stats.totalSpecies / 100) * 100 : stats.totalSpecies}
          </div>
          <div className="text-sm text-gray-500">
            {stats.totalSpecies >= 100
              ? `${100 - (stats.totalSpecies % 100)} to ${Math.ceil(stats.totalSpecies / 100) * 100}`
              : `${100 - stats.totalSpecies} to 100`}
          </div>
        </div>
      </motion.div>

      {/* Area-Based Recommendations - birds found in same areas as your life list */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-100 p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-teal-600" />
                  Birds in Your Areas
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get 3 bird recommendations found in the same wetlands, forests, or regions as your life list species.
                </p>
              </div>

              {/* Zip code for "near you" location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your location (optional – for &quot;where to find near you&quot; tips)
                </label>
                <div className="flex gap-2">
                  <select
                    value={recCountryCode}
                    onChange={(e) => setRecCountryCode(e.target.value)}
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
                    value={recZipCode}
                    onChange={(e) => {
                      setRecZipCode(e.target.value)
                      setRecLocationError(null)
                    }}
                    placeholder="Zip code"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={lookupRecZipCode}
                    disabled={recLocationLoading || !recZipCode.trim()}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {recLocationLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MapPinIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">or</span>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={geoLoading}
                    className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
                  >
                    {geoLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        Use my location
                      </>
                    ) : (
                      <>
                        <MapPinIcon className="w-4 h-4" />
                        Use my location
                      </>
                    )}
                  </button>
                </div>
                {recLocation && (
                  <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {recLocationName || 'Location set'} – recommendations will include local tips
                  </p>
                )}
                {(recLocationError || geoError) && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {recLocationError || geoError}
                  </p>
                )}
              </div>

              <button
                onClick={handleGetAreaRecommendations}
                disabled={areaLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl font-medium shadow-md transition-all w-full sm:w-auto self-start"
              >
                {areaLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finding birds...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Get 3 Recommendations
                  </>
                )}
              </button>
            </div>

            {areaError && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                {areaError}
              </p>
            )}

            {areaBirds.length > 0 && (
              <div className="mt-6 pt-6 border-t border-teal-200">
                <h4 className="text-sm font-medium text-teal-800 mb-4">Suggested targets from your areas</h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {areaBirds.map((bird, i) => (
                      <motion.div
                        key={bird.species}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <BirdRecommendationCard bird={bird} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {areaFallbackText && areaBirds.length === 0 && (
              <div className="mt-6 pt-6 border-t border-teal-200">
                <h4 className="text-sm font-medium text-teal-800 mb-3">Suggested targets</h4>
                <div className="markdown-content prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{areaFallbackText}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search your life list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSort('dateAdded')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              sortField === 'dateAdded'
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Date
            {sortField === 'dateAdded' &&
              (sortDirection === 'desc' ? (
                <ArrowDownIcon className="w-4 h-4" />
              ) : (
                <ArrowUpIcon className="w-4 h-4" />
              ))}
          </button>
          <button
            onClick={() => handleSort('species')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              sortField === 'species'
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            A-Z
            {sortField === 'species' &&
              (sortDirection === 'desc' ? (
                <ArrowDownIcon className="w-4 h-4" />
              ) : (
                <ArrowUpIcon className="w-4 h-4" />
              ))}
          </button>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Add Species
        </button>
      </motion.div>

      {/* Life List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            {entries.length === 0 ? (
              <>
                <ListBulletIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Your Life List
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Add species you've seen to track your birding journey. Log sightings in the Journal and mark them as "lifers" to automatically add them here!
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Your First Species
                </button>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No matching species
                </h3>
                <p className="text-gray-500">
                  Try a different search term
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Number */}
                  <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {entries.length - entries.findIndex((e) => e.id === entry.id)}
                  </div>

                  {/* Species Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{entry.species}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDate(entry.dateAdded)}
                      </span>
                      {entry.location && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {entry.location}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  {deleteConfirm === entry.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(entry.id)}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove from life list"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Results count */}
      {filteredEntries.length > 0 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Showing {filteredEntries.length} of {entries.length} species
        </p>
      )}

      {/* Add Species Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add to Life List</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {addSuccess ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">Added to your life list!</h3>
                </div>
              ) : (
                <form onSubmit={handleAddSpecies} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Species *
                    </label>
                    <BirdAutocomplete
                      value={newSpecies}
                      onChange={setNewSpecies}
                      placeholder="Start typing a bird name..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location (optional)
                    </label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="Where did you first see it?"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Any memorable details..."
                      rows={2}
                      className="input-field"
                    />
                  </div>

                  {addError && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {addError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add to Life List
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
