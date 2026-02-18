import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  AcademicCapIcon,
  LightBulbIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { getQuiz, checkQuizAnswer, learnSpecies, compareSpecies } from '../lib/api'
import BirdAutocomplete from '../components/BirdAutocomplete'

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'species' | 'compare'>('quiz')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  // Quiz form
  const [difficulty, setDifficulty] = useState('intermediate')
  const [topic, setTopic] = useState('')
  const [region, setRegion] = useState('')
  const [quizQuestion, setQuizQuestion] = useState<string | null>(null)
  const [quizAnswer, setQuizAnswer] = useState('')
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null)
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false)

  // Species form
  const [speciesName, setSpeciesName] = useState('')

  // Compare form
  const [species1, setSpecies1] = useState('')
  const [species2, setSpecies2] = useState('')

  const handleGetQuiz = async () => {
    setIsLoading(true)
    setQuizQuestion(null)
    setQuizAnswer('')
    setQuizFeedback(null)
    try {
      const response = await getQuiz(difficulty, topic || undefined, region || undefined)
      setResult(response.quiz)
      setQuizQuestion(response.quiz)
    } catch (error) {
      console.error('Error:', error)
      setResult('Error generating quiz. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quizQuestion || !quizAnswer.trim()) return
    setIsCheckingAnswer(true)
    setQuizFeedback(null)
    try {
      const response = await checkQuizAnswer(quizQuestion, quizAnswer.trim())
      setQuizFeedback(response.feedback)
    } catch (error) {
      console.error('Error:', error)
      setQuizFeedback('Error checking answer. Please try again.')
    } finally {
      setIsCheckingAnswer(false)
    }
  }

  const handleLearnSpecies = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!speciesName) return

    setIsLoading(true)
    try {
      const response = await learnSpecies(speciesName)
      setResult(response.species_info)
    } catch (error) {
      console.error('Error:', error)
      setResult('Error fetching species info. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompareSpecies = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!species1 || !species2) return

    setIsLoading(true)
    try {
      const response = await compareSpecies(species1, species2)
      setResult(response.comparison)
    } catch (error) {
      console.error('Error:', error)
      setResult('Error comparing species. Please try again.')
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
        <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <AcademicCapIcon className="w-4 h-4" />
          Learning Coach Agent
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Learn Birding
        </h1>
        <p className="text-gray-600">
          Build your bird identification skills with quizzes and species deep-dives
        </p>
      </motion.div>

      {/* Tab Selector */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'quiz'
              ? 'bg-rose-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
          }`}
        >
          <LightBulbIcon className="w-5 h-5" />
          Quiz Me
        </button>
        <button
          onClick={() => setActiveTab('species')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'species'
              ? 'bg-rose-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
          }`}
        >
          <AcademicCapIcon className="w-5 h-5" />
          Species Deep-Dive
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'compare'
              ? 'bg-rose-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
          }`}
        >
          <ArrowsRightLeftIcon className="w-5 h-5" />
          Compare Species
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="agent-card p-6"
        >
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quiz Settings
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="input-field"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., warblers, shorebirds, songs"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region (optional)
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g., Eastern US, California"
                  className="input-field"
                />
              </div>

              <button
                onClick={handleGetQuiz}
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <LightBulbIcon className="w-5 h-5" />
                    Get Quiz Question
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'species' && (
            <form onSubmit={handleLearnSpecies} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Species Deep-Dive
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species Name
                </label>
                <BirdAutocomplete
                  value={speciesName}
                  onChange={setSpeciesName}
                  placeholder="e.g., Northern Cardinal"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!speciesName || isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <AcademicCapIcon className="w-5 h-5" />
                    Learn About Species
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'compare' && (
            <form onSubmit={handleCompareSpecies} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Compare Similar Species
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species 1
                </label>
                <BirdAutocomplete
                  value={species1}
                  onChange={setSpecies1}
                  placeholder="e.g., Downy Woodpecker"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species 2
                </label>
                <BirdAutocomplete
                  value={species2}
                  onChange={setSpecies2}
                  placeholder="e.g., Hairy Woodpecker"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!species1 || !species2 || isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <ArrowsRightLeftIcon className="w-5 h-5" />
                    Compare Species
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Topics */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Popular Topics</h4>
            <div className="flex flex-wrap gap-2">
              {['Warblers', 'Sparrows', 'Shorebirds', 'Raptors', 'Songs', 'Field Marks'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTopic(t)
                    setActiveTab('quiz')
                  }}
                  className="text-xs bg-gray-100 hover:bg-rose-100 text-gray-600 hover:text-rose-700 px-3 py-1.5 rounded-full transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 agent-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-rose-600" />
            {activeTab === 'quiz' && 'Quiz Question'}
            {activeTab === 'species' && 'Species Account'}
            {activeTab === 'compare' && 'Species Comparison'}
          </h3>

          {result ? (
            <div className="space-y-6">
              <div className="markdown-content prose prose-sm max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>

              {activeTab === 'quiz' && quizQuestion && (
                <form onSubmit={handleCheckAnswer} className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your answer
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={quizAnswer}
                      onChange={(e) => setQuizAnswer(e.target.value)}
                      placeholder="Type your answer (e.g., A, Northern Cardinal, or the full answer)"
                      className="input-field flex-1"
                      disabled={isCheckingAnswer}
                    />
                    <button
                      type="submit"
                      disabled={!quizAnswer.trim() || isCheckingAnswer}
                      className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors shrink-0"
                    >
                      {isCheckingAnswer && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {isCheckingAnswer ? 'Checking...' : 'Check Answer'}
                    </button>
                  </div>
                  {quizFeedback && (
                    <div
                      className={`mt-4 p-4 rounded-xl border ${
                        quizFeedback.toLowerCase().startsWith('correct')
                          ? 'bg-emerald-50 border-emerald-100'
                          : 'bg-amber-50 border-amber-100'
                      }`}
                    >
                      <p className="text-gray-800 font-medium">{quizFeedback}</p>
                    </div>
                  )}
                </form>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {activeTab === 'quiz' && 'Click "Get Quiz Question" to start learning'}
                {activeTab === 'species' && 'Enter a species name to learn about it'}
                {activeTab === 'compare' && 'Enter two species to compare them'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
