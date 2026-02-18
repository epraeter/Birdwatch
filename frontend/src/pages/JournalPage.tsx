import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  BookOpenIcon,
  PlusIcon,
  DocumentTextIcon,
  SparklesIcon,
  ListBulletIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { logSighting, summarizeTrip } from '../lib/api'
import BirdAutocomplete from '../components/BirdAutocomplete'
import { useLifeListStore } from '../store/lifeListStore'

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState<'log' | 'summarize'>('log')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [liferAdded, setLiferAdded] = useState(false)

  // Life list store
  const { addEntry, hasSpecies, getStats } = useLifeListStore()
  const lifeListStats = getStats()

  // Log sighting form
  const [species, setSpecies] = useState('')
  const [count, setCount] = useState(1)
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')
  const [behavior, setBehavior] = useState('')
  const [habitat, setHabitat] = useState('')
  const [isLifer, setIsLifer] = useState(false)

  // Trip summary form
  const [tripNotes, setTripNotes] = useState('')

  // Check if species is already on life list
  const speciesOnList = species.trim() ? hasSpecies(species) : false

  const handleLogSighting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!species) return

    setIsLoading(true)
    setLiferAdded(false)
    
    try {
      const response = await logSighting({
        species,
        count,
        location_name: locationName,
        notes,
        behavior,
        habitat,
        is_lifer: isLifer,
      })
      setResult(response.log_entry)

      // Add to life list if marked as a lifer and not already on list
      if (isLifer && !hasSpecies(species)) {
        addEntry({
          species,
          location: locationName || undefined,
          notes: notes || undefined,
          count,
          behavior: behavior || undefined,
          habitat: habitat || undefined,
        })
        setLiferAdded(true)
      }

      // Reset form
      setSpecies('')
      setCount(1)
      setLocationName('')
      setNotes('')
      setBehavior('')
      setHabitat('')
      setIsLifer(false)
    } catch (error) {
      console.error('Error:', error)
      setResult('Error logging sighting. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarizeTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripNotes) return

    setIsLoading(true)
    try {
      const response = await summarizeTrip(tripNotes)
      setResult(response.summary)
    } catch (error) {
      console.error('Error:', error)
      setResult('Error generating summary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <BookOpenIcon className="w-4 h-4" />
          Journal Agent
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Birding Journal
        </h1>
        <p className="text-gray-600">
          Log your sightings and generate beautiful trip summaries
        </p>
      </motion.div>

      {/* Life List Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-6"
      >
        <Link
          to="/lifelist"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all group"
        >
          <ListBulletIcon className="w-5 h-5" />
          <span className="font-medium">Life List: {lifeListStats.totalSpecies} species</span>
          <span className="text-amber-200 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </motion.div>

      {/* Tab Selector */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'log'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
          }`}
        >
          <PlusIcon className="w-5 h-5" />
          Log Sighting
        </button>
        <button
          onClick={() => setActiveTab('summarize')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'summarize'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
          }`}
        >
          <DocumentTextIcon className="w-5 h-5" />
          Trip Summary
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="agent-card p-6"
        >
          {activeTab === 'log' ? (
            <form onSubmit={handleLogSighting} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Log a New Sighting
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species *
                </label>
                <BirdAutocomplete
                  value={species}
                  onChange={setSpecies}
                  placeholder="Start typing a bird name..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Central Park"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Behavior Observed
                </label>
                <input
                  type="text"
                  value={behavior}
                  onChange={(e) => setBehavior(e.target.value)}
                  placeholder="e.g., Foraging on lawn"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Habitat
                </label>
                <input
                  type="text"
                  value={habitat}
                  onChange={(e) => setHabitat(e.target.value)}
                  placeholder="e.g., Urban park, deciduous trees"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional observations..."
                  rows={3}
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isLifer"
                    checked={isLifer}
                    onChange={(e) => setIsLifer(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                    disabled={speciesOnList}
                  />
                  <label htmlFor="isLifer" className="text-sm text-gray-700">
                    This is a life bird! (First time seeing this species)
                  </label>
                </div>
                
                {speciesOnList && species.trim() && (
                  <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    {species} is already on your life list
                  </p>
                )}

                {liferAdded && (
                  <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    Added to your life list! (#{lifeListStats.totalSpecies})
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!species || isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5" />
                    Log Sighting
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSummarizeTrip} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generate Trip Summary
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Notes
                </label>
                <textarea
                  value={tripNotes}
                  onChange={(e) => setTripNotes(e.target.value)}
                  placeholder={`Enter your trip notes, sightings list, or raw observations. For example:

May 15, 2025 - Central Park, NY
Started at 6:30am, overcast, 55F

Species seen:
- 3 American Robins (foraging on lawn)
- 1 Red-tailed Hawk (soaring overhead)
- 12 House Sparrows (at feeder)
- 2 Northern Cardinals (singing)
- 1 Great Blue Heron (flyover!) - highlight!

Beautiful morning, lots of activity. First warblers of the season expected soon.`}
                  rows={12}
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!tripNotes || isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Generate Summary
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="agent-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            {activeTab === 'log' ? 'Logged Entry' : 'Trip Summary'}
          </h3>

          {result ? (
            <div className="markdown-content prose prose-sm max-w-none overflow-y-auto max-h-[60vh]">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {activeTab === 'log'
                  ? 'Log a sighting to see it documented here'
                  : 'Enter your trip notes to generate a summary'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
