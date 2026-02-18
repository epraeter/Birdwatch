"""Birding Tours Agent - Finds local birding tours, walks, and guided outings."""

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools

from app.config import get_settings


def create_birding_tours_agent() -> Agent:
    """Create the birding tours agent that finds local tours and walks."""

    settings = get_settings()

    return Agent(
        name="Birding Tours Agent",
        role="Specialist in finding local birding tours, guided walks, bird watching excursions, and Audubon field trips",
        model=OpenAIChat(
            id="gpt-4o",
            api_key=settings.openai_api_key
        ),
        tools=[DuckDuckGoTools()],
        instructions=[
            "You help birders find local birding tours, guided walks, and bird watching excursions.",
            "",
            "**Your task:** Search the web for birding tours and bird walks near a given location.",
            "",
            "**What to find:**",
            "- Audubon chapter field trips and bird walks",
            "- Nature center birding programs",
            "- Guided bird watching tours (half-day, full-day)",
            "- Bird festival events and walks",
            "- Wildlife refuge guided bird walks",
            "- Park ranger-led bird walks",
            "- Birding club outings and meetups",
            "",
            "**Output format:** You MUST return a valid JSON array. Use this exact structure:",
            '{"tours": [{"title": "Tour name", "location": "Where it takes place (venue/park/city)", "url": "https://full-url-to-the-page", "description": "Brief 1-2 sentence description"}]}',
            "",
            "**Rules:**",
            "- Include 5-10 tour/walk results when available",
            "- Each tour MUST have a valid, working URL to the source page",
            "- Location should be specific: park name, refuge name, or city/region",
            "- Only include real, findable tours - prefer organizations with web presence",
            "- If few results exist, return what you find; empty array if none",
            "- NEVER make up URLs - only include links from actual search results",
        ],
        markdown=False,
    )


BirdingToursAgent = create_birding_tours_agent
