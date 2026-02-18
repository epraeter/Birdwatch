"""eBird API integration tools for Agno agents."""

import httpx
from typing import Optional
from agno.tools import Toolkit
from app.config import get_settings


class EBirdTools(Toolkit):
    """Tools for interacting with the eBird API."""
    
    def __init__(self):
        super().__init__(name="ebird")
        self.settings = get_settings()
        self.base_url = self.settings.ebird_base_url
        self.headers = {"X-eBirdApiToken": self.settings.ebird_api_key}
        
        # Register tool functions
        self.register(self.get_recent_observations)
        self.register(self.get_notable_observations)
        self.register(self.get_nearby_hotspots)
        self.register(self.get_species_observations)
        self.register(self.get_region_info)
        self.register(self.get_hotspot_info)
        self.register(self.get_taxonomy)
        self.register(self.get_rare_birds_nearby)
    
    def get_recent_observations(
        self,
        region_code: str,
        back_days: int = 14,
        max_results: int = 100
    ) -> str:
        """
        Get recent bird observations for a region.
        
        Args:
            region_code: eBird region code (e.g., 'US-CA' for California, 'US-CA-037' for Los Angeles County)
            back_days: Number of days back to search (1-30)
            max_results: Maximum number of results to return
            
        Returns:
            JSON string of recent observations with species, location, date, and count
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.base_url}/data/obs/{region_code}/recent",
                    headers=self.headers,
                    params={"back": min(back_days, 30), "maxResults": max_results}
                )
                response.raise_for_status()
                observations = response.json()
                
                # Format results
                results = []
                for obs in observations:
                    results.append({
                        "species": obs.get("comName", "Unknown"),
                        "scientific_name": obs.get("sciName", ""),
                        "location": obs.get("locName", "Unknown location"),
                        "date": obs.get("obsDt", ""),
                        "count": obs.get("howMany", "X"),
                        "lat": obs.get("lat"),
                        "lng": obs.get("lng")
                    })
                
                return str(results)
        except Exception as e:
            return f"Error fetching observations: {str(e)}"
    
    def get_notable_observations(
        self,
        region_code: str,
        back_days: int = 7,
        max_results: int = 50
    ) -> str:
        """
        Get notable/rare bird observations for a region.
        
        Args:
            region_code: eBird region code
            back_days: Number of days back to search (1-30)
            max_results: Maximum number of results
            
        Returns:
            JSON string of notable observations
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.base_url}/data/obs/{region_code}/recent/notable",
                    headers=self.headers,
                    params={"back": min(back_days, 30), "maxResults": max_results}
                )
                response.raise_for_status()
                observations = response.json()
                
                results = []
                for obs in observations:
                    results.append({
                        "species": obs.get("comName", "Unknown"),
                        "scientific_name": obs.get("sciName", ""),
                        "location": obs.get("locName", "Unknown location"),
                        "date": obs.get("obsDt", ""),
                        "count": obs.get("howMany", "X"),
                        "lat": obs.get("lat"),
                        "lng": obs.get("lng"),
                        "is_reviewed": obs.get("obsReviewed", False),
                        "is_valid": obs.get("obsValid", False)
                    })
                
                return str(results)
        except Exception as e:
            return f"Error fetching notable observations: {str(e)}"
    
    def get_nearby_hotspots(
        self,
        lat: float,
        lng: float,
        distance_km: int = 25,
        max_results: int = 20
    ) -> str:
        """
        Get birding hotspots near a location.
        
        Args:
            lat: Latitude of the location
            lng: Longitude of the location
            distance_km: Search radius in kilometers (max 50)
            max_results: Maximum number of hotspots to return
            
        Returns:
            JSON string of nearby hotspots with names, locations, and species counts
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.base_url}/ref/hotspot/geo",
                    headers=self.headers,
                    params={
                        "lat": lat,
                        "lng": lng,
                        "dist": min(distance_km, 50),
                        "fmt": "json"
                    }
                )
                response.raise_for_status()
                hotspots = response.json()[:max_results]
                
                results = []
                for hs in hotspots:
                    results.append({
                        "name": hs.get("locName", "Unknown"),
                        "hotspot_id": hs.get("locId", ""),
                        "lat": hs.get("lat"),
                        "lng": hs.get("lng"),
                        "country": hs.get("countryCode", ""),
                        "region": hs.get("subnational1Code", ""),
                        "species_count": hs.get("numSpeciesAllTime", 0),
                        "latest_observation": hs.get("latestObsDt", "")
                    })
                
                return str(results)
        except Exception as e:
            return f"Error fetching hotspots: {str(e)}"
    
    def get_species_observations(
        self,
        species_code: str,
        region_code: str,
        back_days: int = 14,
        max_results: int = 50
    ) -> str:
        """
        Get recent observations of a specific species in a region.
        
        Args:
            species_code: eBird species code (e.g., 'norcar' for Northern Cardinal)
            region_code: eBird region code
            back_days: Number of days back to search
            max_results: Maximum results
            
        Returns:
            JSON string of species observations
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.base_url}/data/obs/{region_code}/recent/{species_code}",
                    headers=self.headers,
                    params={"back": min(back_days, 30), "maxResults": max_results}
                )
                response.raise_for_status()
                observations = response.json()
                
                results = []
                for obs in observations:
                    results.append({
                        "species": obs.get("comName", "Unknown"),
                        "location": obs.get("locName", "Unknown location"),
                        "date": obs.get("obsDt", ""),
                        "count": obs.get("howMany", "X"),
                        "lat": obs.get("lat"),
                        "lng": obs.get("lng")
                    })
                
                return str(results)
        except Exception as e:
            return f"Error fetching species observations: {str(e)}"
    
    def get_region_info(self, region_code: str) -> str:
        """
        Get information about an eBird region.
        
        Args:
            region_code: eBird region code
            
        Returns:
            Region information including name and bounds
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.base_url}/ref/region/info/{region_code}",
                    headers=self.headers
                )
                response.raise_for_status()
                info = response.json()
                
                return str({
                    "name": info.get("result", "Unknown"),
                    "region_code": region_code,
                    "bounds": info.get("bounds", {})
                })
        except Exception as e:
            return f"Error fetching region info: {str(e)}"
    
    def get_hotspot_info(self, hotspot_id: str) -> str:
        """
        Get detailed information about a specific hotspot.
        
        Args:
            hotspot_id: eBird hotspot location ID
            
        Returns:
            Hotspot details including name, coordinates, and recent activity
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.base_url}/ref/hotspot/info/{hotspot_id}",
                    headers=self.headers
                )
                response.raise_for_status()
                info = response.json()
                
                return str({
                    "name": info.get("name", "Unknown"),
                    "hotspot_id": hotspot_id,
                    "lat": info.get("latitude"),
                    "lng": info.get("longitude"),
                    "country": info.get("countryCode", ""),
                    "region": info.get("subnational1Code", ""),
                    "species_count": info.get("numSpeciesAllTime", 0)
                })
        except Exception as e:
            return f"Error fetching hotspot info: {str(e)}"
    
    def get_taxonomy(
        self,
        species_codes: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> str:
        """
        Get taxonomy information for bird species.
        
        Args:
            species_codes: Comma-separated species codes to look up
            search_query: Search term to find species by name
            
        Returns:
            Taxonomy information for matching species
        """
        try:
            with httpx.Client() as client:
                params = {"fmt": "json"}
                if species_codes:
                    params["species"] = species_codes
                    
                response = client.get(
                    f"{self.base_url}/ref/taxonomy/ebird",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                taxonomy = response.json()
                
                # Filter by search query if provided
                if search_query:
                    search_lower = search_query.lower()
                    taxonomy = [
                        t for t in taxonomy 
                        if search_lower in t.get("comName", "").lower() 
                        or search_lower in t.get("sciName", "").lower()
                    ][:20]
                
                results = []
                for t in taxonomy[:50]:
                    results.append({
                        "common_name": t.get("comName", ""),
                        "scientific_name": t.get("sciName", ""),
                        "species_code": t.get("speciesCode", ""),
                        "category": t.get("category", ""),
                        "order": t.get("order", ""),
                        "family": t.get("familyComName", ""),
                        "family_scientific": t.get("familySciName", "")
                    })
                
                return str(results)
        except Exception as e:
            return f"Error fetching taxonomy: {str(e)}"
    
    def get_rare_birds_nearby(
        self,
        lat: float,
        lng: float,
        distance_km: int = 50,
        back_days: int = 7
    ) -> str:
        """
        Get rare/notable bird sightings near a location.
        
        Args:
            lat: Latitude
            lng: Longitude
            distance_km: Search radius in kilometers
            back_days: Days to look back
            
        Returns:
            List of rare bird sightings in the area
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.base_url}/data/obs/geo/recent/notable",
                    headers=self.headers,
                    params={
                        "lat": lat,
                        "lng": lng,
                        "dist": min(distance_km, 50),
                        "back": min(back_days, 30)
                    }
                )
                response.raise_for_status()
                observations = response.json()
                
                results = []
                for obs in observations:
                    results.append({
                        "species": obs.get("comName", "Unknown"),
                        "scientific_name": obs.get("sciName", ""),
                        "location": obs.get("locName", "Unknown location"),
                        "date": obs.get("obsDt", ""),
                        "count": obs.get("howMany", "X"),
                        "lat": obs.get("lat"),
                        "lng": obs.get("lng"),
                        "distance_km": round(
                            ((obs.get("lat", lat) - lat) ** 2 + 
                             (obs.get("lng", lng) - lng) ** 2) ** 0.5 * 111, 
                            1
                        )
                    })
                
                # Sort by distance
                results.sort(key=lambda x: x.get("distance_km", 999))
                
                return str(results)
        except Exception as e:
            return f"Error fetching rare birds: {str(e)}"
