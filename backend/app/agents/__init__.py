"""BirdWatch AI Agents - Specialized birding assistants."""

from app.agents.identification import IdentificationAgent
from app.agents.behavior import BehaviorInterpreterAgent
from app.agents.location import LocationScoutAgent
from app.agents.journal import JournalAgent
from app.agents.coach import LearningCoachAgent
from app.agents.community import CommunityConnectorAgent
from app.agents.tours import BirdingToursAgent
from app.agents.migration import MigrationTrendsAgent
from app.agents.lifelist import LifeListCoachAgent
from app.agents.team import create_birding_team

__all__ = [
    "IdentificationAgent",
    "BehaviorInterpreterAgent",
    "LocationScoutAgent",
    "JournalAgent",
    "LearningCoachAgent",
    "CommunityConnectorAgent",
    "BirdingToursAgent",
    "MigrationTrendsAgent",
    "LifeListCoachAgent",
    "create_birding_team"
]
