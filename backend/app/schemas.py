"""Pydantic schemas for API requests and responses."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class AgentType(str, Enum):
    """Available agent types."""
    IDENTIFICATION = "identification"
    BEHAVIOR = "behavior"
    LOCATION = "location"
    JOURNAL = "journal"
    COACH = "coach"
    COMMUNITY = "community"
    TOURS = "tours"
    MIGRATION = "migration"
    LIFELIST = "lifelist"
    TEAM = "team"  # Uses the coordinated team


class BirdingTour(BaseModel):
    """A birding tour or walk result."""
    title: str
    location: str
    url: str
    description: Optional[str] = None


class ChatMessage(BaseModel):
    """A single chat message."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    """Request to chat with an agent."""
    message: str = Field(..., description="User's message to the agent")
    agent_type: AgentType = Field(
        default=AgentType.TEAM,
        description="Which agent to use (defaults to team coordinator)"
    )
    session_id: Optional[str] = Field(
        None,
        description="Session ID for conversation continuity"
    )
    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional context (location, preferences, etc.)"
    )
    history: Optional[List[ChatMessage]] = Field(
        None,
        description="Previous messages in this conversation (so the agent remembers the original question)"
    )


class ChatResponse(BaseModel):
    """Response from agent chat."""
    response: str = Field(..., description="Agent's response")
    agent_used: str = Field(..., description="Name of the agent that responded")
    session_id: str = Field(..., description="Session ID for follow-up messages")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Tools called during response generation"
    )


class ImageAnalysisRequest(BaseModel):
    """Request to analyze a bird image."""
    image_url: Optional[str] = Field(None, description="URL of the image to analyze")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image")
    location: Optional[str] = Field(None, description="Location where photo was taken")
    date: Optional[str] = Field(None, description="Date photo was taken")
    notes: Optional[str] = Field(None, description="Additional notes or context")


class IdentificationResult(BaseModel):
    """Bird identification result."""
    species: str = Field(..., description="Identified species (common name)")
    scientific_name: str = Field(..., description="Scientific name")
    confidence: float = Field(..., description="Confidence score 0-100")
    field_marks: List[str] = Field(..., description="Key identifying features observed")
    alternatives: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Alternative species possibilities if uncertain"
    )
    notes: Optional[str] = Field(None, description="Additional identification notes")


class LocationRequest(BaseModel):
    """Request for birding location recommendations."""
    latitude: float = Field(..., description="Current latitude")
    longitude: float = Field(..., description="Current longitude")
    target_species: Optional[List[str]] = Field(
        None,
        description="Specific species to find"
    )
    skill_level: Optional[str] = Field(
        "intermediate",
        description="Skill level: beginner, intermediate, advanced"
    )
    max_distance_km: Optional[int] = Field(
        50,
        description="Maximum distance willing to travel"
    )
    duration_hours: Optional[float] = Field(
        4,
        description="Available time for birding"
    )


class Hotspot(BaseModel):
    """A birding hotspot."""
    name: str
    hotspot_id: str
    latitude: float
    longitude: float
    species_count: int
    distance_km: float
    recent_notable: Optional[List[str]] = None


class RouteStop(BaseModel):
    """A stop on a birding route."""
    order: int
    hotspot: Hotspot
    duration_minutes: int
    target_species: List[str]
    tips: Optional[str] = None


class BirdingRoute(BaseModel):
    """A complete birding route."""
    name: str
    total_distance_km: float
    total_duration_hours: float
    stops: List[RouteStop]
    weather_conditions: Optional[Dict[str, Any]] = None
    best_time: Optional[str] = None


class SightingLog(BaseModel):
    """A bird sighting to log."""
    species: str = Field(..., description="Species name")
    count: Optional[int] = Field(1, description="Number observed")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
    behavior: Optional[str] = None
    habitat: Optional[str] = None
    weather: Optional[str] = None
    is_lifer: Optional[bool] = False


class AreaBasedTargetsRequest(BaseModel):
    """Request for bird recommendations based on life list species (same/similar areas)."""
    species: List[str] = Field(..., description="Species already on the user's life list")
    lat: Optional[float] = Field(None, description="Optional: user's current latitude to narrow region")
    longitude: Optional[float] = Field(None, description="Optional: user's current longitude")
    num_targets: int = Field(3, description="Number of target species to suggest (max 3)", ge=1, le=3)


class LifeListStats(BaseModel):
    """Life list statistics."""
    total_species: int
    total_sightings: int
    countries: int
    states_provinces: int
    this_year: int
    this_month: int
    recent_lifers: List[Dict[str, Any]]


class QuizQuestion(BaseModel):
    """A bird identification quiz question."""
    question_id: str
    question_type: str  # "field_marks", "song", "behavior", "range"
    question: str
    options: Optional[List[str]] = None
    difficulty: str  # "beginner", "intermediate", "advanced"
    hint: Optional[str] = None


class QuizAnswer(BaseModel):
    """Answer to a quiz question."""
    question_id: str
    answer: str


class QuizCheckRequest(BaseModel):
    """Request body for checking a quiz answer."""
    question: str
    answer: str


class QuizResult(BaseModel):
    """Result of answering a quiz question."""
    correct: bool
    correct_answer: str
    explanation: str
    next_question: Optional[QuizQuestion] = None


class RareBirdAlert(BaseModel):
    """A rare bird alert."""
    species: str
    scientific_name: str
    location: str
    latitude: float
    longitude: float
    date_observed: datetime
    observer_count: int
    significance: str  # "county_first", "state_rare", "vagrant", etc.
    last_seen: Optional[datetime] = None
    refind_probability: str  # "high", "medium", "low"
    directions: Optional[str] = None


class HealthCheck(BaseModel):
    """API health check response."""
    status: str
    version: str
    agents_available: List[str]
