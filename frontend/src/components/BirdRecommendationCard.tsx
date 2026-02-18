import { useState, useEffect } from 'react'

export interface BirdRecommendation {
  species: string
  scientific_name?: string
  where_to_find: string
  info: string
  difficulty: 'Easy' | 'Moderate' | 'Challenging'
}

interface WikipediaInfo {
  image?: string
  description?: string
  url?: string
}

const wikiCache: Record<string, WikipediaInfo> = {}

function fetchWikipediaInfo(species: string, scientificName?: string): Promise<WikipediaInfo> {
  const searchTerm = scientificName || species
  if (wikiCache[searchTerm]) return Promise.resolve(wikiCache[searchTerm])

  return fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`,
    { headers: { Accept: 'application/json' } }
  )
    .then((res) => {
      if (!res.ok && scientificName && species !== scientificName) {
        return fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(species)}`,
          { headers: { Accept: 'application/json' } }
        )
      }
      return res
    })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Not found'))))
    .then((data) => {
      const info: WikipediaInfo = {
        image: data.thumbnail?.source,
        description: data.extract,
        url: data.content_urls?.desktop?.page,
      }
      wikiCache[searchTerm] = info
      return info
    })
    .catch(() => ({ image: undefined, description: undefined, url: undefined }))
}

const difficultyColors = {
  Easy: 'bg-green-100 text-green-700',
  Moderate: 'bg-amber-100 text-amber-700',
  Challenging: 'bg-orange-100 text-orange-700',
} as const

export default function BirdRecommendationCard({ bird }: { bird: BirdRecommendation }) {
  const [wikiInfo, setWikiInfo] = useState<WikipediaInfo | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    fetchWikipediaInfo(bird.species, bird.scientific_name).then(setWikiInfo)
  }, [bird.species, bird.scientific_name])

  const description = wikiInfo?.description || bird.info
  const truncatedDesc = description
    ? (description.match(/[^.!?]+[.!?]+/g) || []).slice(0, 2).join(' ').trim() || description.slice(0, 200)
    : bird.info

  const ebirdSlug = bird.species.toLowerCase().replace(/\s+/g, '')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-36 flex-shrink-0 bg-gray-50 relative">
          <div className="aspect-square">
            {!wikiInfo ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : wikiInfo.image && !imageError ? (
              <img
                src={wikiInfo.image}
                alt={bird.species}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                <span className="text-4xl">🐦</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-bold text-gray-900 text-lg">{bird.species}</h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                difficultyColors[bird.difficulty] || difficultyColors.Moderate
              }`}
            >
              {bird.difficulty}
            </span>
          </div>
          {bird.scientific_name && (
            <p className="text-gray-500 text-sm italic mb-2">{bird.scientific_name}</p>
          )}

          {truncatedDesc && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{truncatedDesc}</p>
          )}

          <div className="space-y-1.5 mb-4">
            <p className="text-sm">
              <span className="font-medium text-teal-700">Where to find: </span>
              <span className="text-gray-700">{bird.where_to_find}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {wikiInfo?.url && (
              <a
                href={wikiInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Wikipedia
              </a>
            )}
            <a
              href={`https://ebird.org/species/${ebirdSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              eBird
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
