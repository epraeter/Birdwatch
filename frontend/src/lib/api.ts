import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export type AgentType = 
  | 'identification'
  | 'behavior'
  | 'location'
  | 'journal'
  | 'coach'
  | 'community'
  | 'migration'
  | 'lifelist'
  | 'team'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  agent_type?: AgentType
  session_id?: string
  context?: Record<string, unknown>
  history?: ChatMessage[]
}

export interface ChatResponse {
  response: string
  agent_used: string
  session_id: string
  tool_calls?: Array<Record<string, unknown>>
}

export interface LocationRequest {
  latitude: number
  longitude: number
  target_species?: string[]
  skill_level?: 'beginner' | 'intermediate' | 'advanced'
  max_distance_km?: number
  duration_hours?: number
}

export interface SightingLog {
  species: string
  count?: number
  latitude?: number
  longitude?: number
  location_name?: string
  date?: string
  notes?: string
  behavior?: string
  habitat?: string
  weather?: string
  is_lifer?: boolean
}

// Chat endpoints
export const chat = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat', request)
  return response.data
}

export const chatStream = async (
  request: ChatRequest,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No reader available')

  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data !== '[DONE]') {
          onChunk(data)
        }
      }
    }
  }
}

// Identification endpoints
export const identifyBird = async (data: {
  image_url?: string
  image_base64?: string
  location?: string
  date?: string
  notes?: string
}) => {
  const response = await api.post('/identify', data)
  return response.data
}

export const identifyBirdUpload = async (
  file: File,
  metadata?: { location?: string; date?: string; notes?: string }
) => {
  const formData = new FormData()
  formData.append('file', file)
  if (metadata?.location) formData.append('location', metadata.location)
  if (metadata?.date) formData.append('date', metadata.date)
  if (metadata?.notes) formData.append('notes', metadata.notes)
  
  const response = await api.post('/identify/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// Location endpoints
export const getLocationRecommendations = async (request: LocationRequest) => {
  const response = await api.post('/locations/recommend', request)
  return response.data
}

export const getNearbyHotspots = async (lat: number, lng: number, distanceKm = 25) => {
  const response = await api.get('/locations/hotspots', {
    params: { lat, lng, distance_km: distanceKm },
  })
  return response.data
}

export const getRareBirds = async (lat: number, lng: number, distanceKm = 50, days = 7) => {
  const response = await api.get('/locations/rare-birds', {
    params: { lat, lng, distance_km: distanceKm, days },
  })
  return response.data
}

export const createBirdingRoute = async (request: LocationRequest) => {
  const response = await api.post('/locations/route', request)
  return response.data
}

// Journal endpoints
export const logSighting = async (sighting: SightingLog) => {
  const response = await api.post('/journal/log', sighting)
  return response.data
}

export const summarizeTrip = async (notes: string) => {
  const response = await api.post('/journal/summarize', { notes })
  return response.data
}

// Learning endpoints
export const getQuiz = async (
  difficulty = 'intermediate',
  topic?: string,
  region?: string
) => {
  const response = await api.get('/learn/quiz', {
    params: { difficulty, topic, region },
  })
  return response.data
}

export const checkQuizAnswer = async (question: string, answer: string) => {
  const response = await api.post('/learn/quiz/check', { question, answer })
  return response.data
}

export const learnSpecies = async (speciesName: string) => {
  const response = await api.post('/learn/species', { species_name: speciesName })
  return response.data
}

export const compareSpecies = async (species1: string, species2: string) => {
  const response = await api.post('/learn/compare', null, {
    params: { species1, species2 },
  })
  return response.data
}

// Community endpoints
export const getAlerts = async (lat: number, lng: number, distanceKm = 50) => {
  const response = await api.get('/community/alerts', {
    params: { lat, lng, distance_km: distanceKm },
  })
  return response.data
}

export const shouldReportSighting = async (sighting: SightingLog) => {
  const response = await api.post('/community/should-report', sighting)
  return response.data
}

export const findBirdingGroups = async (location: string) => {
  const response = await api.get('/community/groups', {
    params: { location },
  })
  return response.data
}

export interface BirdingTour {
  title: string
  location: string
  url: string
  description?: string
}

export const findBirdingTours = async (location: string) => {
  const response = await api.get<{ tours: BirdingTour[]; location: string; agent: string }>(
    '/community/tours',
    { params: { location } }
  )
  return response.data
}

// Behavior endpoints
export const explainBehavior = async (
  species: string,
  behaviorDescription: string,
  location?: string
) => {
  const response = await api.post('/behavior/explain', null, {
    params: { species, behavior_description: behaviorDescription, location },
  })
  return response.data
}

export const getSeasonalBehaviors = async (species: string, month?: number) => {
  const response = await api.get('/behavior/seasonal', {
    params: { species, month },
  })
  return response.data
}

// Weather/conditions
export const getBirdingConditions = async (lat: number, lng: number) => {
  const response = await api.get('/conditions', {
    params: { lat, lng },
  })
  return response.data
}

// Migration endpoints
export const getMigrationForecast = async (lat: number, lng: number, region?: string) => {
  const response = await api.get('/migration/forecast', {
    params: { lat, lng, region },
  })
  return response.data
}

export const getBestTimeToSee = async (species: string, lat: number, lng: number, region?: string) => {
  const response = await api.get('/migration/best-time', {
    params: { species, lat, lng, region },
  })
  return response.data
}

export const getSpeciesMigrationInfo = async (species: string, lat?: number, lng?: number) => {
  const response = await api.get('/migration/species-info', {
    params: { species, lat, lng },
  })
  return response.data
}

// Life List Coach endpoints
export const getLifeListTargets = async (
  lat: number,
  lng: number,
  region?: string,
  skillLevel: string = 'intermediate',
  numTargets: number = 5
) => {
  const response = await api.get('/lifelist/targets', {
    params: { lat, lng, region, skill_level: skillLevel, num_targets: numTargets },
  })
  return response.data
}

export const analyzeLifeList = async (
  speciesCount: number,
  lat: number,
  lng: number,
  region?: string,
  missingCommon?: string
) => {
  const response = await api.get('/lifelist/analyze', {
    params: { species_count: speciesCount, lat, lng, region, missing_common: missingCommon },
  })
  return response.data
}

export const getSeasonalTargets = async (lat: number, lng: number, region?: string) => {
  const response = await api.get('/lifelist/seasonal-targets', {
    params: { lat, lng, region },
  })
  return response.data
}

export const getAreaBasedTargets = async (
  species: string[],
  options?: { lat?: number; lng?: number; numTargets?: number }
) => {
  const response = await api.post('/lifelist/area-based-targets', {
    species,
    lat: options?.lat,
    longitude: options?.lng,
    num_targets: options?.numTargets ?? 3,
  })
  return response.data
}

export default api
