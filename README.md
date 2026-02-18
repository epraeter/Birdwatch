# BirdWatch AI - Multi-Agent Birding Assistant

A comprehensive birding web application powered by **Agno** multi-agent AI framework and **eBird** API integration. Nine specialized AI agents work together to help you identify, learn, explore, and connect with the birding world.

## Features

### 9 Specialized AI Agents

1. **Identification Agent** - Analyzes photos and descriptions to identify bird species with confidence scores, highlights distinguishing features, and suggests alternatives when uncertain.

2. **Behavior Interpreter Agent** - Explains bird behaviors (feeding, mating displays, migration timing), predicts what might happen next during encounters.

3. **Location Scout Agent** - Studies eBird data, weather patterns, and seasonal trends to recommend where and when to find target species. Creates personalized birding routes based on your skill level.

4. **Journal Agent** - Automatically logs sightings, generates narrative summaries of birding sessions, tracks your life list, and helps spot patterns in observations.

5. **Learning Coach Agent** - Quizzes you on calls, field marks, and identification tips. Adapts difficulty based on progress, provides species deep-dives, and evaluates quiz answers with simple correct/incorrect feedback.

6. **Community Connector Agent** - Suggests when to share sightings and connects you with local birding groups. Rare bird alerts are on the Locations page.

7. **Birding Tours Agent** - Finds local birding tours, guided walks, Audubon field trips, and nature center programs. Returns cards with location and links to source pages.

8. **Migration Trends Agent** - Provides migration forecasts for the next 1–2 weeks, predicts the best time to see specific species, and explains seasonal arrival/departure patterns.

9. **Life List Coach Agent** - Suggests realistic target species to add to your life list based on location and season, analyzes your progress, and recommends time-sensitive seasonal targets.

### Interactive Bird Map

- **Locations page** - Interactive Leaflet map showing hotspots and rare bird sightings
- **Rich popups** - Wikipedia descriptions, images, and AI-powered migration info for each rare bird
- **Zip code lookup** - Enter a zip code (US, CA, UK, DE, FR, AU) to center the map on your area
- **Use my location** - One-tap location detection (city/state level) via browser Geolocation; falls back to IP-based location when Geolocation is unavailable

### Learn Page

- **Quiz** - Get bird identification questions (beginner/intermediate/advanced); type your answer and check for correct/incorrect feedback
- **Species Deep-Dive** - Detailed species accounts with field marks, similar species, songs, habitat, and behavior
- **Compare Species** - Side-by-side comparison of two similar species (e.g., Downy vs Hairy Woodpecker)
- **Bird autocomplete** - Species inputs use autocomplete with fuzzy spelling (e.g., "Nothern" suggests Northern Cardinal)

### Life List Tracking

- **Personal life list** - Add and track every species you've seen (persisted in browser storage)
- **Bird autocomplete** - 400+ North American species with smart search and fuzzy spelling when adding birds
- **Stats & milestones** - Total species, this year/month counts, progress toward next 100-species milestone
- **Search & sort** - Filter by species or location; sort by date or alphabetically
- **Area-based recommendations** - Get AI suggestions for birds found in the same wetlands, forests, or regions as species you've already seen (no new travel required)

### Chat with Any Agent

- **Team coordinator** - Default chat routes to the right specialist automatically
- **Direct agent chat** - Chat with a specific agent (e.g., `/chat/migration`, `/chat/lifelist`) for focused assistance

## Tech Stack

- **Backend**: FastAPI + Python 3.12
- **AI Framework**: Agno (Multi-agent orchestration)
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Database**: PostgreSQL
- **Caching**: Redis
- **APIs**: eBird API, Open-Meteo Weather

## Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key
- eBird API key (get from https://ebird.org/api/keygen)

### Environment Setup

1. Clone the repository:
```bash
cd capstone
```

2. Create a `.env` file in the root directory:
```bash
# Required
OPENAI_API_KEY=your_openai_api_key
EBIRD_API_KEY=your_ebird_api_key

# Optional
ANTHROPIC_API_KEY=your_anthropic_api_key
TAVILY_API_KEY=your_tavily_api_key
```

### Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Running Locally (Development)

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys
cp .env.example .env
# Edit .env with your keys

# Run the server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## API Endpoints

### Chat
- `POST /api/chat` - Chat with any agent
- `POST /api/chat/stream` - Stream chat responses

### Identification
- `POST /api/identify` - Identify bird from description/URL
- `POST /api/identify/upload` - Upload image for identification

### Locations
- `POST /api/locations/recommend` - Get location recommendations
- `GET /api/locations/hotspots` - Get nearby hotspots
- `GET /api/locations/rare-birds` - Get rare bird alerts
- `POST /api/locations/route` - Create a birding route

### Journal
- `POST /api/journal/log` - Log a sighting
- `POST /api/journal/summarize` - Generate trip summary

### Learning
- `GET /api/learn/quiz` - Get quiz question
- `POST /api/learn/quiz/check` - Submit and evaluate quiz answer (returns correct/incorrect feedback)
- `POST /api/learn/species` - Get species deep-dive (body: `{"species_name": "..."}`)
- `POST /api/learn/compare` - Compare two species

### Community
- `GET /api/community/alerts` - Get rare bird alerts
- `GET /api/community/tours` - Find local birding tours and walks (Birding Tours Agent)
- `POST /api/community/should-report` - Get reporting advice
- `GET /api/community/groups` - Find local birding groups

### Behavior
- `POST /api/behavior/explain` - Explain observed behavior
- `GET /api/behavior/seasonal` - Get seasonal behaviors

### Migration
- `GET /api/migration/forecast` - Get migration forecast for next 1–2 weeks
- `GET /api/migration/best-time` - Best time to see a specific species at a location
- `GET /api/migration/species-info` - Migration profile for a species (used in map popups)

### Life List Coach
- `GET /api/lifelist/targets` - Get suggested target species to add to life list
- `GET /api/lifelist/analyze` - Analyze life list progress and suggest strategy
- `GET /api/lifelist/seasonal-targets` - Get time-sensitive target species for current season
- `POST /api/lifelist/area-based-targets` - Recommend birds found in the same/similar areas as your existing life list species

### Weather
- `GET /api/conditions` - Get birding conditions

## Project Structure

```
capstone/
├── backend/
│   ├── app/
│   │   ├── agents/           # Agno AI agents
│   │   │   ├── identification.py
│   │   │   ├── behavior.py
│   │   │   ├── location.py
│   │   │   ├── journal.py
│   │   │   ├── coach.py
│   │   │   ├── community.py
│   │   │   ├── tours.py     # Birding tours & walks
│   │   │   ├── migration.py  # Migration forecasts & timing
│   │   │   ├── lifelist.py   # Life list strategy & targets
│   │   │   └── team.py       # Agent orchestration
│   │   ├── tools/            # Custom tools for agents
│   │   │   ├── ebird.py      # eBird API integration
│   │   │   └── weather.py    # Weather API integration
│   │   ├── config.py         # Configuration
│   │   ├── schemas.py        # Pydantic models
│   │   └── main.py           # FastAPI application
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── BirdMap.tsx   # Interactive map with hotspots & rare birds
│   │   │   ├── BirdAutocomplete.tsx  # Species search with fuzzy spelling (400+ birds)
│   │   │   └── ...
│   │   ├── pages/            # Page components
│   │   │   ├── ChatPage.tsx
│   │   │   ├── IdentifyPage.tsx
│   │   │   ├── LocationsPage.tsx
│   │   │   ├── JournalPage.tsx
│   │   │   ├── LearnPage.tsx
│   │   │   ├── CommunityPage.tsx   # Birding tours & walks
│   │   │   ├── LifeListPage.tsx
│   │   │   └── ...
│   │   ├── hooks/            # Custom hooks
│   │   │   └── useUserLocation.ts  # Geolocation + IP fallback
│   │   ├── lib/              # API client
│   │   ├── store/            # State management (Zustand)
│   │   │   ├── chatStore.ts
│   │   │   └── lifeListStore.ts  # Persisted life list
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Acknowledgments

- [Agno](https://agno.com) - Multi-agent AI framework
- [eBird](https://ebird.org) - Bird observation data
- [Cornell Lab of Ornithology](https://www.birds.cornell.edu) - Ornithological research
