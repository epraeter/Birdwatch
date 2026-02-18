"""Birding Team - Orchestrates all birding agents using Agno Teams."""

from agno.team import Team
from agno.models.openai import OpenAIChat

from app.agents.identification import create_identification_agent
from app.agents.behavior import create_behavior_interpreter_agent
from app.agents.location import create_location_scout_agent
from app.agents.journal import create_journal_agent
from app.agents.coach import create_learning_coach_agent
from app.agents.community import create_community_connector_agent
from app.agents.migration import create_migration_agent
from app.agents.lifelist import create_lifelist_coach_agent
from app.config import get_settings


def create_birding_team() -> Team:
    """
    Create the main birding team that coordinates all specialized agents.
    
    The team leader routes requests to the appropriate agent(s) based on the task.
    """
    settings = get_settings()
    
    return Team(
        name="BirdWatch AI Team",
        model=OpenAIChat(
            id="gpt-4o",
            api_key=settings.openai_api_key
        ),
        members=[
            create_identification_agent(),
            create_behavior_interpreter_agent(),
            create_location_scout_agent(),
            create_journal_agent(),
            create_learning_coach_agent(),
            create_community_connector_agent(),
            create_migration_agent(),
            create_lifelist_coach_agent()
        ],
        respond_directly=False,  # Team leader synthesizes responses
        determine_input_for_members=True,  # Route to appropriate members
        instructions=[
            "You are the coordinator of a team of expert birding AI assistants.",
            "Your job is to understand what the user needs and delegate to the right specialist(s).",
            "",
            "**Your Team Members:**",
            "",
            "1. **Identification Agent** - For identifying birds from photos, descriptions, or audio",
            "   - Use for: 'What bird is this?', 'I saw a [description]', 'Help me ID this'",
            "",
            "2. **Behavior Interpreter Agent** - For explaining bird behaviors",
            "   - Use for: 'Why is it doing that?', 'What does this behavior mean?', 'Will it...'",
            "",
            "3. **Location Scout Agent** - For finding birding spots and creating routes",
            "   - Use for: 'Where can I find...', 'Best spots near...', 'Create a route for...'",
            "",
            "4. **Journal Agent** - For logging sightings and tracking lists",
            "   - Use for: 'Log this sighting', 'My life list', 'Summarize my trip', 'Track my birds'",
            "",
            "5. **Learning Coach Agent** - For education and skill building",
            "   - Use for: 'Quiz me', 'Teach me about...', 'How do I tell apart...', 'I want to learn'",
            "",
            "6. **Community Connector Agent** - For rare birds and community connections",
            "   - Use for: 'Any rare birds?', 'Should I report this?', 'Local bird groups', 'Chase alerts'",
            "",
            "7. **Migration Trends Agent** - For migration forecasts, timing predictions, and seasonal patterns",
            "   - Use for: 'When do warblers arrive?', 'Migration forecast', 'Best week to see X', 'Is X migrating now?'",
            "",
            "8. **Life List Coach Agent** - For life list strategy and finding next target species",
            "   - Use for: 'What bird should I try to find next?', 'Easy birds I might be missing', 'Grow my life list', 'Target species for this season'",
            "   - Use for: 'Birds in the same areas as my life list', 'Species found where I've already birded' (user should share their species list)",
            "",
            "**Delegation Strategy:**",
            "- For clear single-domain requests, delegate to one agent",
            "- For complex requests, you may delegate to multiple agents",
            "- Always provide context when delegating",
            "- Synthesize responses when multiple agents contribute",
            "",
            "**User context:**",
            "- If Context includes the user's location (location name, latitude, longitude), use it. Do not ask for location when it is already provided.",
            "- For questions like 'where can I find X' or 'best spots for Y', use the provided location to give specific, local answers.",
            "- When any agent returns locations with coordinates, format them as Google Maps links (e.g. https://www.google.com/maps?q=LAT,LNG), not raw latitude/longitude.",
            "",
            "**Follow-up replies:**",
            "- When the user replies after you asked for more information (e.g. you asked 'What is your location?'), remember their original question from the previous conversation.",
            "- Answer the original question using the new information they just provided (e.g. give location-based advice using their stated location).",
            "",
            "Be friendly and enthusiastic about birding!",
            "If unsure which agent to use, ask clarifying questions."
        ],
        markdown=True
    )


def create_router_team() -> Team:
    """
    Alternative: Create a router team that directly routes to specialists.
    
    This is faster as it doesn't synthesize responses, just routes to the right agent.
    """
    settings = get_settings()
    
    return Team(
        name="BirdWatch Router",
        model=OpenAIChat(
            id="gpt-4o-mini",  # Faster model for routing
            api_key=settings.openai_api_key
        ),
        members=[
            create_identification_agent(),
            create_behavior_interpreter_agent(),
            create_location_scout_agent(),
            create_journal_agent(),
            create_learning_coach_agent(),
            create_community_connector_agent(),
            create_migration_agent(),
            create_lifelist_coach_agent()
        ],
        respond_directly=True,  # Route directly to specialists
        instructions=[
            "Route the user's request to the most appropriate birding specialist.",
            "- Identification questions -> Identification Agent",
            "- Behavior questions -> Behavior Interpreter Agent",
            "- Location/hotspot questions -> Location Scout Agent",
            "- Logging/tracking questions -> Journal Agent", 
            "- Learning/quiz requests -> Learning Coach Agent",
            "- Rare birds/community -> Community Connector Agent",
            "- Migration timing/forecasts/trends -> Migration Trends Agent",
            "- Life list targets/next birds to find -> Life List Coach Agent"
        ],
        markdown=True
    )
