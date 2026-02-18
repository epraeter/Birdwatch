"""BirdWatch AI - FastAPI Backend with Agno Multi-Agent System."""

import uuid
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.schemas import (
    ChatRequest, ChatResponse, AgentType,
    ImageAnalysisRequest, LocationRequest,
    SightingLog, QuizAnswer, QuizCheckRequest, HealthCheck,
    AreaBasedTargetsRequest
)
from app.agents import (
    IdentificationAgent,
    BehaviorInterpreterAgent,
    LocationScoutAgent,
    JournalAgent,
    LearningCoachAgent,
    CommunityConnectorAgent,
    BirdingToursAgent,
    MigrationTrendsAgent,
    LifeListCoachAgent,
    create_birding_team
)


# Agent instances cache
_agents: Dict[str, Any] = {}
_team = None


def get_agent(agent_type: AgentType):
    """Get or create an agent instance."""
    global _agents, _team
    
    if agent_type == AgentType.TEAM:
        if _team is None:
            _team = create_birding_team()
        return _team
    
    if agent_type.value not in _agents:
        agent_creators = {
            AgentType.IDENTIFICATION: IdentificationAgent,
            AgentType.BEHAVIOR: BehaviorInterpreterAgent,
            AgentType.LOCATION: LocationScoutAgent,
            AgentType.JOURNAL: JournalAgent,
            AgentType.COACH: LearningCoachAgent,
            AgentType.COMMUNITY: CommunityConnectorAgent,
            AgentType.TOURS: BirdingToursAgent,
            AgentType.MIGRATION: MigrationTrendsAgent,
            AgentType.LIFELIST: LifeListCoachAgent,
        }
        _agents[agent_type.value] = agent_creators[agent_type]()
    
    return _agents[agent_type.value]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    settings = get_settings()
    print(f"Starting BirdWatch AI v0.1.0")
    print(f"Debug mode: {settings.debug}")
    yield
    # Shutdown
    print("Shutting down BirdWatch AI")


# Create FastAPI app
app = FastAPI(
    title="BirdWatch AI",
    description="Multi-agent birding assistant powered by Agno",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Health & Info ====================

@app.get("/")
async def root():
    """API root - health check with API key status."""
    settings = get_settings()
    
    api_status = {
        "openai": "configured" if settings.openai_api_key else "missing",
        "ebird": "configured" if settings.ebird_api_key else "missing",
        "anthropic": "configured" if settings.anthropic_api_key else "not set (optional)",
        "tavily": "configured" if settings.tavily_api_key else "not set (optional)",
    }
    
    agents_available = []
    if settings.openai_api_key:
        agents_available = [
            "identification",
            "behavior", 
            "location",
            "journal",
            "coach",
            "community",
            "tours",
            "migration",
            "lifelist",
            "team"
        ]
    
    return {
        "status": "healthy",
        "version": "0.1.0",
        "api_keys": api_status,
        "agents_available": agents_available,
        "message": "Set OPENAI_API_KEY and EBIRD_API_KEY in .env for full functionality"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return await root()


# ==================== Chat Endpoints ====================

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with a birding agent.
    
    Send a message and get a response from the specified agent.
    Use agent_type='team' (default) for the coordinator to route to specialists.
    """
    try:
        agent = get_agent(request.agent_type)
        session_id = request.session_id or str(uuid.uuid4())
        
        # Build the message with context and conversation history
        parts = []
        if request.context:
            context_str = "\n".join([f"{k}: {v}" for k, v in request.context.items()])
            parts.append(f"Context (use this when relevant):\n{context_str}")
        if request.history and len(request.history) > 0:
            history_lines = []
            for m in request.history:
                role = "User" if m.role == "user" else "Assistant"
                history_lines.append(f"{role}: {m.content}")
            parts.append("Previous conversation:\n" + "\n".join(history_lines))
        parts.append("Current user message: " + request.message)
        message = "\n\n".join(parts)
        
        # Run the agent
        response = agent.run(message)
        
        # Extract response content
        response_text = ""
        tool_calls = []
        
        if hasattr(response, 'content'):
            response_text = response.content
        elif hasattr(response, 'messages') and response.messages:
            for msg in response.messages:
                if hasattr(msg, 'content') and msg.content:
                    response_text += msg.content
        else:
            response_text = str(response)
        
        return ChatResponse(
            response=response_text,
            agent_used=agent.name if hasattr(agent, 'name') else request.agent_type.value,
            session_id=session_id,
            tool_calls=tool_calls if tool_calls else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream a chat response from a birding agent.
    
    Returns a streaming response for real-time display.
    """
    async def generate():
        try:
            agent = get_agent(request.agent_type)
            
            parts = []
            if request.context:
                context_str = "\n".join([f"{k}: {v}" for k, v in request.context.items()])
                parts.append(f"Context (use this when relevant):\n{context_str}")
            if request.history and len(request.history) > 0:
                history_lines = [f"{('User' if m.role == 'user' else 'Assistant')}: {m.content}" for m in request.history]
                parts.append("Previous conversation:\n" + "\n".join(history_lines))
            parts.append("Current user message: " + request.message)
            message = "\n\n".join(parts)
            
            # Stream the response
            for chunk in agent.run(message, stream=True):
                if hasattr(chunk, 'content') and chunk.content:
                    yield f"data: {chunk.content}\n\n"
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


# ==================== Identification Endpoints ====================

@app.post("/api/identify")
async def identify_bird(request: ImageAnalysisRequest):
    """
    Identify a bird from an image or description.
    
    Provide either an image URL, base64 encoded image, or description.
    """
    agent = get_agent(AgentType.IDENTIFICATION)
    
    # Build the identification prompt
    prompt_parts = ["Please identify this bird."]
    
    if request.image_url:
        prompt_parts.append(f"Image URL: {request.image_url}")
    
    if request.location:
        prompt_parts.append(f"Location: {request.location}")
    
    if request.date:
        prompt_parts.append(f"Date: {request.date}")
    
    if request.notes:
        prompt_parts.append(f"Notes: {request.notes}")
    
    prompt = "\n".join(prompt_parts)
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "identification": response_text,
            "agent": "Identification Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/identify/upload")
async def identify_bird_upload(
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    """
    Identify a bird from an uploaded image using GPT-4 Vision.
    """
    import base64
    import httpx
    
    settings = get_settings()
    
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured. Please add it to your .env file."
        )
    
    # Read and encode the image
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    
    # Determine the media type
    content_type = file.content_type or "image/jpeg"
    
    # Build the prompt
    prompt_parts = ["Please identify the bird in this image."]
    if location:
        prompt_parts.append(f"Location where photo was taken: {location}")
    if date:
        prompt_parts.append(f"Date: {date}")
    if notes:
        prompt_parts.append(f"Additional notes: {notes}")
    
    prompt_parts.append("""
Provide your analysis including:
1. Species identification with confidence score (0-100%)
2. Key distinguishing features you observed
3. Alternative species if confidence is below 80%
4. Any behavioral or habitat clues visible in the image
Include both common and scientific names.""")
    
    text_prompt = "\n".join(prompt_parts)
    
    try:
        # Call OpenAI Vision API directly for image analysis
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": text_prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{content_type};base64,{base64_image}",
                                        "detail": "high"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 1500
                },
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            
            identification = result["choices"][0]["message"]["content"]
            
            return {
                "identification": identification,
                "agent": "Identification Agent (Vision)",
                "filename": file.filename
            }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Location Endpoints ====================

@app.post("/api/locations/recommend")
async def recommend_locations(request: LocationRequest):
    """
    Get birding location recommendations based on your location and targets.
    """
    agent = get_agent(AgentType.LOCATION)
    
    prompt_parts = [
        f"Find birding locations near coordinates ({request.latitude}, {request.longitude}).",
        f"Maximum distance: {request.max_distance_km} km",
        f"Available time: {request.duration_hours} hours",
        f"Skill level: {request.skill_level}"
    ]
    
    if request.target_species:
        prompt_parts.append(f"Target species: {', '.join(request.target_species)}")
    
    prompt = "\n".join(prompt_parts)
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "recommendations": response_text,
            "agent": "Location Scout Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/locations/hotspots")
async def get_nearby_hotspots(
    lat: float,
    lng: float,
    distance_km: int = 25
):
    """
    Get birding hotspots near a location.
    """
    import httpx
    
    settings = get_settings()
    
    if not settings.ebird_api_key:
        raise HTTPException(
            status_code=500,
            detail="EBIRD_API_KEY not configured. Please add it to your .env file."
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ebird_base_url}/ref/hotspot/geo",
                headers={"X-eBirdApiToken": settings.ebird_api_key},
                params={
                    "lat": lat,
                    "lng": lng,
                    "dist": min(distance_km, 50),
                    "fmt": "json"
                },
                timeout=30.0
            )
            response.raise_for_status()
            hotspots = response.json()
            
            # Format the results
            results = []
            for hs in hotspots[:20]:  # Limit to 20
                results.append({
                    "name": hs.get("locName", "Unknown"),
                    "hotspot_id": hs.get("locId", ""),
                    "lat": hs.get("lat"),
                    "lng": hs.get("lng"),
                    "country": hs.get("countryCode", ""),
                    "region": hs.get("subnational1Code", ""),
                    "species_count": hs.get("numSpeciesAllTime", 0)
                })
            
            return {"hotspots": results, "count": len(results)}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"eBird API error: {str(e)}")


@app.get("/api/locations/rare-birds")
async def get_rare_birds(
    lat: float,
    lng: float,
    distance_km: int = 50,
    days: int = 7
):
    """
    Get rare bird sightings near a location.
    """
    import httpx
    
    settings = get_settings()
    
    if not settings.ebird_api_key:
        raise HTTPException(
            status_code=500,
            detail="EBIRD_API_KEY not configured. Please add it to your .env file."
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ebird_base_url}/data/obs/geo/recent/notable",
                headers={"X-eBirdApiToken": settings.ebird_api_key},
                params={
                    "lat": lat,
                    "lng": lng,
                    "dist": min(distance_km, 50),
                    "back": min(days, 30)
                },
                timeout=30.0
            )
            response.raise_for_status()
            birds = response.json()
            
            # Format the results as both markdown and structured data
            results = []
            markdown = f"## Rare Bird Sightings\n\n"
            markdown += f"**{len(birds)} notable sightings found within {distance_km} km:**\n\n"
            
            for bird in birds[:20]:  # Limit to 20
                bird_data = {
                    "species": bird.get("comName", "Unknown"),
                    "scientific_name": bird.get("sciName", ""),
                    "location": bird.get("locName", "Unknown location"),
                    "date": bird.get("obsDt", ""),
                    "count": bird.get("howMany", "X"),
                    "lat": bird.get("lat"),
                    "lng": bird.get("lng")
                }
                results.append(bird_data)
                
                # Add to markdown
                markdown += f"### {bird_data['species']}\n"
                markdown += f"*{bird_data['scientific_name']}*\n\n"
                markdown += f"- **Count:** {bird_data['count']}\n"
                markdown += f"- **Location:** {bird_data['location']}\n"
                markdown += f"- **Date:** {bird_data['date']}\n\n"
            
            return {
                "rare_birds": markdown,  # Markdown for display
                "birds": results,  # Structured data for mapping
                "count": len(results)
            }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"eBird API error: {str(e)}")


@app.post("/api/locations/route")
async def create_birding_route(request: LocationRequest):
    """
    Create a personalized birding route.
    """
    agent = get_agent(AgentType.LOCATION)
    
    prompt = f"""Create a birding route starting from ({request.latitude}, {request.longitude}).
    
Requirements:
- Maximum distance: {request.max_distance_km} km
- Available time: {request.duration_hours} hours
- Skill level: {request.skill_level}
- Target species: {', '.join(request.target_species) if request.target_species else 'Any good birds'}

Please provide an ordered route with stops, expected species, and timing."""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "route": response_text,
            "agent": "Location Scout Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Journal Endpoints ====================

@app.post("/api/journal/log")
async def log_sighting(sighting: SightingLog):
    """
    Log a bird sighting.
    """
    agent = get_agent(AgentType.JOURNAL)
    
    prompt = f"""Please log this bird sighting:

Species: {sighting.species}
Count: {sighting.count}
Location: {sighting.location_name or f'({sighting.latitude}, {sighting.longitude})'}
Date: {sighting.date or 'Today'}
Notes: {sighting.notes or 'None'}
Behavior: {sighting.behavior or 'Not specified'}
Habitat: {sighting.habitat or 'Not specified'}
Is this a life bird? {sighting.is_lifer}

Please confirm the logging and provide any additional information about this species."""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "log_entry": response_text,
            "sighting": sighting.model_dump(),
            "agent": "Journal Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/journal/summarize")
async def summarize_trip(notes: str = Body(embed=True)):
    """
    Generate a narrative summary of a birding trip.
    """
    agent = get_agent(AgentType.JOURNAL)
    
    prompt = f"""Please create a narrative summary of this birding trip:

{notes}

Include highlights, total species count, and memorable moments."""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "summary": response_text,
            "agent": "Journal Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Learning Endpoints ====================

@app.get("/api/learn/quiz")
async def get_quiz(
    difficulty: str = "intermediate",
    topic: Optional[str] = None,
    region: Optional[str] = None
):
    """
    Get a bird identification quiz question.
    """
    agent = get_agent(AgentType.COACH)
    
    prompt_parts = [f"Give me a {difficulty} level bird identification quiz question."]
    
    if topic:
        prompt_parts.append(f"Focus on: {topic}")
    if region:
        prompt_parts.append(f"For birds found in: {region}")
    
    prompt_parts.append("""Format the multiple choice options with each on its own line. Use this exact structure:
- A) First choice
- B) Second choice
- C) Third choice
- D) Fourth choice
Use exactly 4 options, labeled A through D. Put each on a separate line with a hyphen so they display clearly.""")
    
    prompt = "\n".join(prompt_parts)
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "quiz": response_text,
            "difficulty": difficulty,
            "agent": "Learning Coach Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learn/quiz/check")
async def check_quiz_answer(body: QuizCheckRequest):
    """
    Evaluate a user's answer to a quiz question. Returns feedback on correctness and explanation.
    """
    agent = get_agent(AgentType.COACH)

    prompt = f"""You gave the user this quiz question:

{body.question}

The user answered: {body.answer}

Evaluate their answer. Reply with EXACTLY one of these formats—nothing else:

If correct: "Correct! Well done."
If wrong: "Incorrect. The correct answer is [species or option letter]."

Be strict: accept only exact matches or obvious equivalents (e.g. "A" = the A option, "Common Yellowthroat" = same species)."""

    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)

        return {
            "feedback": response_text,
            "agent": "Learning Coach Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learn/species")
async def learn_species(species_name: str = Body(embed=True)):
    """
    Get a deep-dive on a specific species.
    """
    agent = get_agent(AgentType.COACH)
    
    prompt = f"""Provide a comprehensive species account for: {species_name}

Include:
1. Field identification (all plumages)
2. Similar species and how to distinguish
3. Voice descriptions with mnemonics
4. Habitat preferences
5. Behavior patterns
6. Range and seasonal occurrence
7. Interesting natural history facts"""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "species_info": response_text,
            "species": species_name,
            "agent": "Learning Coach Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learn/compare")
async def compare_species(species1: str, species2: str):
    """
    Compare two similar species to learn the differences.
    """
    agent = get_agent(AgentType.COACH)
    
    prompt = f"""Compare and contrast these two species to help me tell them apart:

Species 1: {species1}
Species 2: {species2}

Focus on field marks, behavior, voice, and habitat differences.
Include tips for distinguishing them in the field."""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "comparison": response_text,
            "species": [species1, species2],
            "agent": "Learning Coach Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Community Endpoints ====================

@app.get("/api/community/alerts")
async def get_alerts(
    lat: float,
    lng: float,
    distance_km: int = 50
):
    """
    Get rare bird alerts for your area.
    Uses direct eBird API call first, then AI agent for analysis if available.
    """
    from app.config import get_settings
    import httpx
    
    settings = get_settings()
    
    # First, try to get raw data from eBird API directly
    rare_birds_data = []
    if settings.ebird_api_key:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.ebird_base_url}/data/obs/geo/recent/notable",
                    headers={"X-eBirdApiToken": settings.ebird_api_key},
                    params={
                        "lat": lat,
                        "lng": lng,
                        "dist": min(distance_km, 50),
                        "back": 7
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                rare_birds_data = response.json()
        except Exception as e:
            # eBird API failed, continue to try agent or return error
            pass
    
    # If we got eBird data, format it nicely
    if rare_birds_data:
        # Format the results as markdown
        alerts_md = f"## Rare Bird Alerts\n\n"
        alerts_md += f"**Location:** {lat:.4f}, {lng:.4f} (within {distance_km} km)\n\n"
        
        # Also build structured data for mapping
        birds_for_map = []
        
        if len(rare_birds_data) == 0:
            alerts_md += "No rare birds reported in this area in the last 7 days.\n"
        else:
            alerts_md += f"**{len(rare_birds_data)} notable sightings found:**\n\n"
            
            for bird in rare_birds_data[:20]:  # Limit to 20
                species = bird.get("comName", "Unknown")
                sci_name = bird.get("sciName", "")
                location = bird.get("locName", "Unknown location")
                date = bird.get("obsDt", "Unknown date")
                count = bird.get("howMany", "X")
                bird_lat = bird.get("lat")
                bird_lng = bird.get("lng")
                
                alerts_md += f"### {species}\n"
                alerts_md += f"*{sci_name}*\n\n"
                alerts_md += f"- **Count:** {count}\n"
                alerts_md += f"- **Location:** {location}\n"
                alerts_md += f"- **Date:** {date}\n"
                if bird_lat and bird_lng:
                    alerts_md += f"- **Coordinates:** {bird_lat:.4f}, {bird_lng:.4f}\n"
                    birds_for_map.append({
                        "species": species,
                        "scientific_name": sci_name,
                        "location": location,
                        "date": date,
                        "count": count,
                        "lat": bird_lat,
                        "lng": bird_lng
                    })
                alerts_md += "\n"
        
        return {
            "alerts": alerts_md,
            "birds": birds_for_map,  # Raw data for mapping
            "location": {"lat": lat, "lng": lng},
            "count": len(rare_birds_data),
            "agent": "eBird API Direct"
        }
    
    # If no eBird data, try the AI agent
    if settings.openai_api_key:
        try:
            agent = get_agent(AgentType.COMMUNITY)
            
            prompt = f"""Check for rare bird alerts and notable sightings near ({lat}, {lng}) within {distance_km} km.

For each alert, provide:
1. Species and significance
2. Location and directions
3. Last reported time
4. Likelihood of refinding
5. Chase recommendations"""
            
            response = agent.run(prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            return {
                "alerts": response_text,
                "location": {"lat": lat, "lng": lng},
                "agent": "Community Connector Agent"
            }
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Agent error: {str(e)}. Make sure OPENAI_API_KEY is set."
            )
    
    # Neither eBird nor AI agent available
    raise HTTPException(
        status_code=500,
        detail="No API keys configured. Please set EBIRD_API_KEY and/or OPENAI_API_KEY in your .env file."
    )


@app.post("/api/community/should-report")
async def should_report_sighting(sighting: SightingLog):
    """
    Get advice on whether a sighting should be reported and how.
    """
    agent = get_agent(AgentType.COMMUNITY)
    
    prompt = f"""Should I report this bird sighting?

Species: {sighting.species}
Location: {sighting.location_name or f'({sighting.latitude}, {sighting.longitude})'}
Count: {sighting.count}
Date: {sighting.date or 'Today'}
Notes: {sighting.notes}

Please advise on:
1. Is this notable for the location/date?
2. Should it be reported to eBird, local groups, or rare bird alerts?
3. Any documentation recommendations?"""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "advice": response_text,
            "sighting": sighting.model_dump(),
            "agent": "Community Connector Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/community/groups")
async def find_birding_groups(
    location: str
):
    """
    Find local birding groups and clubs.
    """
    agent = get_agent(AgentType.COMMUNITY)
    
    prompt = f"""Find birding groups, clubs, and organizations near {location}.

Include:
1. Local Audubon chapters
2. Bird clubs and societies
3. Facebook groups or online communities
4. Upcoming events or bird walks
5. How to get involved"""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "groups": response_text,
            "location": location,
            "agent": "Community Connector Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/community/tours")
async def find_birding_tours(location: str):
    """
    Find local birding tours, walks, and guided outings using the Birding Tours Agent.
    Returns structured cards with title, location, and link to source page.
    """
    import json
    import re

    agent = get_agent(AgentType.TOURS)

    prompt = f"""Search the web for birding tours, bird walks, guided bird watching excursions, and Audubon field trips near: {location}

Find real, current tours and walks with working URLs. Return ONLY a valid JSON object with this exact structure:
{{"tours": [{{"title": "Tour name", "location": "Venue or city", "url": "https://full-url", "description": "Brief description"}}]}}

Include 5-10 results. Each must have a valid url. Do not make up links."""

    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)

        # Extract JSON from response
        text = response_text.strip()
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                data = json.loads(json_match.group())
                tours = data.get("tours", [])
                # Validate and clean
                valid_tours = []
                for t in tours[:10]:
                    if isinstance(t, dict) and t.get("title") and t.get("url"):
                        valid_tours.append({
                            "title": str(t.get("title", ""))[:200],
                            "location": str(t.get("location", ""))[:200],
                            "url": str(t.get("url", "")).strip(),
                            "description": str(t.get("description", ""))[:300] if t.get("description") else None,
                        })
                return {
                    "tours": valid_tours,
                    "location": location,
                    "agent": "Birding Tours Agent"
                }
            except json.JSONDecodeError:
                pass

        return {"tours": [], "location": location, "agent": "Birding Tours Agent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


# ==================== Behavior Endpoints ====================

@app.post("/api/behavior/explain")
async def explain_behavior(
    species: str,
    behavior_description: str,
    location: Optional[str] = None
):
    """
    Get an explanation of observed bird behavior.
    """
    agent = get_agent(AgentType.BEHAVIOR)
    
    prompt_parts = [
        f"I observed a {species} doing the following:",
        behavior_description,
        "",
        "Please explain:",
        "1. What behavior is this?",
        "2. Why is the bird doing it?",
        "3. What might happen next?",
        "4. Any tips for continued observation?"
    ]
    
    if location:
        prompt_parts.insert(1, f"Location: {location}")
    
    prompt = "\n".join(prompt_parts)
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "explanation": response_text,
            "species": species,
            "agent": "Behavior Interpreter Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/behavior/seasonal")
async def get_seasonal_behaviors(
    species: str,
    month: Optional[int] = None
):
    """
    Get expected behaviors for a species during a given season.
    """
    import datetime
    
    agent = get_agent(AgentType.BEHAVIOR)
    
    current_month = month or datetime.datetime.now().month
    month_name = datetime.date(2000, current_month, 1).strftime('%B')
    
    prompt = f"""What behaviors should I expect to observe in {species} during {month_name}?

Include:
1. Breeding/courtship behaviors (if applicable)
2. Feeding patterns
3. Vocalizations to listen for
4. Migration status
5. Social behaviors
6. Best times/conditions for observation"""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "behaviors": response_text,
            "species": species,
            "month": month_name,
            "agent": "Behavior Interpreter Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Migration & Trends Endpoints ====================

@app.get("/api/migration/forecast")
async def get_migration_forecast(
    lat: float,
    lng: float,
    region: Optional[str] = None
):
    """
    Get migration forecast for the next 1-2 weeks at a location.
    """
    import datetime
    
    agent = get_agent(AgentType.MIGRATION)
    
    current_date = datetime.datetime.now().strftime('%B %d, %Y')
    location_str = region if region else f"coordinates ({lat}, {lng})"
    
    prompt = f"""Provide a migration forecast for {location_str} for the next 1-2 weeks.

Current date: {current_date}
Coordinates: {lat}, {lng}

Please include:
1. **Currently Migrating Species** - Birds passing through right now
2. **Arriving Soon** - Species expected to arrive in the next 1-2 weeks
3. **Departing Soon** - Species leaving the area soon
4. **Weather Impact** - How current/forecasted weather might affect migration
5. **Hot Spots** - Best locations to see migrants in this area
6. **Peak Days** - Any predicted fallout events or peak movement days

Focus on notable and exciting species, not just common birds."""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "forecast": response_text,
            "location": {"lat": lat, "lng": lng, "region": region},
            "date": current_date,
            "agent": "Migration Trends Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.get("/api/migration/best-time")
async def get_best_time_to_see(
    species: str,
    lat: float,
    lng: float,
    region: Optional[str] = None
):
    """
    Get the best time/week to see a specific species at a location.
    """
    agent = get_agent(AgentType.MIGRATION)
    
    location_str = region if region else f"coordinates ({lat}, {lng})"
    
    prompt = f"""When is the best time to see {species} near {location_str}?

Coordinates: {lat}, {lng}

Please provide:
1. **Peak Weeks** - The absolute best dates/weeks to find this species
2. **Spring vs Fall** - Timing differences between migration seasons (if applicable)
3. **Residency Status** - Is this species a resident, breeder, winter visitor, or passage migrant here?
4. **Time of Day** - Best times of day to observe
5. **Habitat Tips** - Where specifically to look during peak times
6. **Current Status** - Is the species present now, and if not, when will it arrive?
7. **Confidence Level** - How reliable are these timing predictions?

Be specific with dates (e.g., "April 25 - May 10" rather than "late April")."""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "timing": response_text,
            "species": species,
            "location": {"lat": lat, "lng": lng, "region": region},
            "agent": "Migration Trends Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.get("/api/migration/species-info")
async def get_species_migration_info(
    species: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None
):
    """
    Get comprehensive migration information for a species.
    Used by the map popup to show migration details for rare bird sightings.
    """
    agent = get_agent(AgentType.MIGRATION)
    
    location_context = ""
    if lat and lng:
        location_context = f"\nUser's location: {lat}, {lng}"
    
    prompt = f"""Provide a concise migration profile for {species}.{location_context}

Include:
1. **Migration Status** - Resident, short-distance migrant, long-distance migrant, or nomadic?
2. **Peak Timing** - When does this species typically pass through or arrive (be specific with dates)?
3. **Current Status** - Based on the current date, is this species likely present, arriving, or departing?
4. **Range** - Brief breeding and wintering range description
5. **Notable Behavior** - Any interesting migration behaviors (flocking, nocturnal flight, staging areas)?

Keep the response concise (2-3 sentences per point) as this will be displayed in a popup."""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "migration_info": response_text,
            "species": species,
            "agent": "Migration Trends Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


# ==================== Life List Coach Endpoints ====================

@app.get("/api/lifelist/targets")
async def get_lifelist_targets(
    lat: float,
    lng: float,
    region: Optional[str] = None,
    skill_level: str = "intermediate",
    num_targets: int = 5
):
    """
    Get suggested target species to add to life list based on location and season.
    """
    import datetime
    
    agent = get_agent(AgentType.LIFELIST)
    
    current_date = datetime.datetime.now().strftime('%B %d, %Y')
    location_str = region if region else f"coordinates ({lat}, {lng})"
    
    prompt = f"""Suggest {num_targets} realistic target species for a birder near {location_str} to add to their life list.

Current date: {current_date}
Coordinates: {lat}, {lng}
Skill level: {skill_level}

For each target species, provide:
1. **Species Name** - Common and scientific name
2. **Why Now?** - Why this is a good time to find this species
3. **Where to Look** - Specific habitat or location recommendations
4. **How to Find It** - Key behaviors, calls, or field marks
5. **Difficulty** - Easy (almost guaranteed), Moderate (good chance), or Challenging (requires effort)
6. **Pro Tip** - Insider advice for finding this species

Prioritize:
- Species currently present and being seen regularly
- Mix of difficulty levels (include some "easy wins")
- Seasonally appropriate targets
- Species visible at this skill level

Be specific and actionable!"""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "targets": response_text,
            "location": {"lat": lat, "lng": lng, "region": region},
            "date": current_date,
            "skill_level": skill_level,
            "agent": "Life List Coach"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.get("/api/lifelist/analyze")
async def analyze_lifelist(
    species_count: int,
    lat: float,
    lng: float,
    region: Optional[str] = None,
    missing_common: Optional[str] = None
):
    """
    Analyze a user's life list progress and suggest strategy.
    """
    agent = get_agent(AgentType.LIFELIST)
    
    location_str = region if region else f"coordinates ({lat}, {lng})"
    missing_context = ""
    if missing_common:
        missing_context = f"\nThe user mentioned they might be missing: {missing_common}"
    
    prompt = f"""A birder near {location_str} has {species_count} species on their life list.{missing_context}

Please provide:

1. **Life List Assessment**
   - What milestone are they approaching? (100, 200, 300, 500?)
   - How does this compare to typical birders in this region?

2. **Gap Analysis**
   - What common species might they be missing?
   - Any "easy" species they should definitely have?

3. **Strategic Recommendations**
   - Top 3-5 species they should prioritize adding
   - Best habitats to explore in their area
   - Seasonal opportunities coming up

4. **Motivation**
   - Celebrate their progress!
   - Set an exciting but achievable next goal

Be encouraging and specific to their location!"""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "analysis": response_text,
            "species_count": species_count,
            "location": {"lat": lat, "lng": lng, "region": region},
            "agent": "Life List Coach"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/api/lifelist/area-based-targets")
async def get_area_based_targets(request: AreaBasedTargetsRequest):
    """
    Recommend birds to add to life list that are found in the same or similar areas
    as species already on the user's list. Uses habitat/range overlap to suggest
    realistic targets without requiring travel to new regions.
    """
    import datetime

    agent = get_agent(AgentType.LIFELIST)

    if not request.species or len(request.species) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one species is required. Add birds to your life list first."
        )

    current_date = datetime.datetime.now().strftime('%B %d, %Y')
    species_list = ", ".join(request.species[:30])  # Limit to avoid token overflow
    if len(request.species) > 30:
        species_list += f" (and {len(request.species) - 30} more)"

    location_context = ""
    if request.lat is not None and request.longitude is not None:
        location_context = f"""
The user's location is ({request.lat}, {request.longitude}). Include specific "where to find near you" advice - suggest habitat types, nearby areas, or spots in their region where these birds are likely. The PRIMARY focus remains birds that share habitat/range with their existing life list species."""

    prompt = f"""A birder has these species on their life list:

**Their Life List (sample):** {species_list}

Current date: {current_date}
{location_context}

**YOUR TASK: Recommend exactly {request.num_targets} birds they could add to their life list that are found in the SAME or VERY SIMILAR areas as the birds they've already seen.**

Key principle: These should be species that CO-OCCUR with their existing life list - birds they might find in the same wetlands, forests, grasslands, or regions where they've already successfully birded.

**OUTPUT FORMAT: Return ONLY valid JSON, no other text. Use this exact structure:**
{{
  "birds": [
    {{
      "species": "Common Name",
      "scientific_name": "Scientific name",
      "where_to_find": "Where to find near the user - specific habitat, locations, or areas (2-3 sentences)",
      "info": "Brief 1-2 sentence description of the bird - key field marks, behavior, or interesting facts",
      "difficulty": "Easy"
    }}
  ]
}}

Rules:
- difficulty must be one of: Easy, Moderate, Challenging
- Exclude any species they've already listed
- Prioritize "easy wins" - common species that frequently co-occur with their existing birds
- where_to_find should be actionable - tell them exactly where to look
- info should be concise - helps with identification
- Return exactly {request.num_targets} birds"""

    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)

        # Extract JSON from response (handle markdown code blocks)
        import json
        import re
        text = response_text.strip()
        # Try to extract JSON from ```json ... ``` blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1).strip()
        try:
            data = json.loads(text)
            birds = data.get("birds", [])[:request.num_targets]
            return {
                "birds": birds,
                "species_analyzed": len(request.species),
                "date": current_date,
                "agent": "Life List Coach"
            }
        except json.JSONDecodeError:
            # Fallback: return raw text for backwards compatibility
            return {
                "birds": [],
                "recommendations": response_text,
                "species_analyzed": len(request.species),
                "date": current_date,
                "agent": "Life List Coach"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.get("/api/lifelist/seasonal-targets")
async def get_seasonal_targets(
    lat: float,
    lng: float,
    region: Optional[str] = None
):
    """
    Get time-sensitive target species for the current season.
    """
    import datetime
    
    agent = get_agent(AgentType.LIFELIST)
    
    current_date = datetime.datetime.now().strftime('%B %d, %Y')
    current_month = datetime.datetime.now().strftime('%B')
    location_str = region if region else f"coordinates ({lat}, {lng})"
    
    prompt = f"""What are the must-see, time-sensitive target species for a birder near {location_str} RIGHT NOW?

Current date: {current_date}
Month: {current_month}
Coordinates: {lat}, {lng}

Focus on species that are:
1. **Only here briefly** - Migrants passing through, winter visitors about to leave, etc.
2. **Displaying unique behaviors** - Breeding displays, singing, nesting
3. **Easier to find now than other times** - Vocal, visible, concentrated

For each species:
- Why is NOW the best time?
- How long is the window? (days, weeks?)
- Where specifically to look
- What to look/listen for

Create urgency for time-sensitive opportunities! These are the "don't miss" species of the moment."""
    
    try:
        response = agent.run(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "seasonal_targets": response_text,
            "location": {"lat": lat, "lng": lng, "region": region},
            "date": current_date,
            "agent": "Life List Coach"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


# ==================== Weather & Conditions ====================

@app.get("/api/conditions")
async def get_birding_conditions(lat: float, lng: float):
    """
    Get current birding conditions for a location.
    """
    from app.tools.weather import WeatherTools
    
    weather = WeatherTools()
    conditions = weather.get_birding_conditions(lat, lng)
    forecast = weather.get_weather_forecast(lat, lng)
    
    return {
        "conditions": conditions,
        "forecast": forecast
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
