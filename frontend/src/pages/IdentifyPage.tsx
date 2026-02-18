import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  CameraIcon,
  PhotoIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { identifyBird, identifyBirdUpload } from '../lib/api'

export default function IdentifyPage() {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        setImage(file)
        setImagePreview(URL.createObjectURL(file))
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image && !description) return

    setIsLoading(true)
    setResult(null)

    try {
      let response

      if (image) {
        response = await identifyBirdUpload(image, {
          location,
          date,
          notes: description,
        })
      } else {
        response = await identifyBird({
          notes: description,
          location,
          date,
        })
      }

      setResult(response.identification)
    } catch (error) {
      console.error('Identification error:', error)
      setResult('Sorry, there was an error processing your request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearForm = () => {
    setImage(null)
    setImagePreview(null)
    setDescription('')
    setLocation('')
    setDate('')
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <CameraIcon className="w-4 h-4" />
          Identification Agent
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Identify a Bird
        </h1>
        <p className="text-gray-600">
          Upload a photo or describe what you saw, and our AI will help identify the species
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="agent-card p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bird Photo
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setImagePreview(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop an image, or{' '}
                      <label className="text-forest-600 hover:text-forest-700 cursor-pointer font-medium">
                        browse
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports JPG, PNG, WEBP up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional if photo provided)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the bird: size, colors, shape, behavior..."
                rows={4}
                className="input-field"
              />
            </div>

            {/* Location & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Central Park, NY"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={(!image && !description) || isLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Identify Bird
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={clearForm}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="agent-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-forest-600" />
            Identification Results
          </h3>

          {result ? (
            <div className="markdown-content prose prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CameraIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                Upload a photo or describe a bird to get started
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
