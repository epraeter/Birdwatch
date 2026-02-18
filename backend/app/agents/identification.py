"""Identification Agent - Analyzes photos/audio and identifies bird species."""

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools

from app.tools.ebird import EBirdTools
from app.config import get_settings


def create_identification_agent() -> Agent:
    """Create the bird identification agent."""
    
    settings = get_settings()
    
    return Agent(
        name="Identification Agent",
        role="Expert ornithologist specializing in bird identification from visual and audio cues",
        model=OpenAIChat(
            id="gpt-4o",
            api_key=settings.openai_api_key
        ),
        tools=[
            EBirdTools(),
            DuckDuckGoTools()
        ],
        instructions=[
            "You are an expert bird identification specialist with decades of field experience.",
            "When analyzing images or descriptions:",
            "1. First identify the most likely species with a confidence score (0-100%)",
            "2. List 3-5 key distinguishing features you observed (plumage, size, shape, bill type, etc.)",
            "3. If confidence is below 80%, provide 2-3 alternative species possibilities",
            "4. Explain what features would help confirm the identification",
            "5. Note any behavioral or habitat clues that support the ID",
            "",
            "For audio/song descriptions:",
            "1. Describe the song pattern, pitch, and rhythm",
            "2. Compare to similar-sounding species",
            "3. Note regional variations if relevant",
            "",
            "Always use the eBird taxonomy for species names and include both common and scientific names.",
            "If the user provides a location, use that context to narrow down possibilities based on range.",
            "Be encouraging but honest about uncertainty - it's okay to say 'I'm not certain' and explain why."
        ],
        markdown=True
    )


# Convenience alias
IdentificationAgent = create_identification_agent
