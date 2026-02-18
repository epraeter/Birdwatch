"""Application configuration."""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    ebird_api_key: str = ""
    tavily_api_key: str = ""
    
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/birdwatch"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # App Settings
    debug: bool = True
    secret_key: str = "change-me-in-production"
    
    # eBird API
    ebird_base_url: str = "https://api.ebird.org/v2"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
