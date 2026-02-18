"""Weather tools for birding predictions."""

import httpx
from agno.tools import Toolkit


class WeatherTools(Toolkit):
    """Tools for getting weather data relevant to birding."""
    
    def __init__(self):
        super().__init__(name="weather")
        self.register(self.get_weather_forecast)
        self.register(self.get_birding_conditions)
    
    def get_weather_forecast(
        self,
        lat: float,
        lng: float
    ) -> str:
        """
        Get weather forecast for a location using Open-Meteo (free, no API key).
        
        Args:
            lat: Latitude of the location
            lng: Longitude of the location
            
        Returns:
            Weather forecast including temperature, precipitation, wind, and conditions
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lng,
                        "hourly": "temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover,visibility",
                        "daily": "sunrise,sunset,precipitation_sum,wind_speed_10m_max",
                        "timezone": "auto",
                        "forecast_days": 7
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Get current conditions (first hour)
                hourly = data.get("hourly", {})
                daily = data.get("daily", {})
                
                current = {
                    "temperature_c": hourly.get("temperature_2m", [None])[0],
                    "precipitation_probability": hourly.get("precipitation_probability", [0])[0],
                    "wind_speed_kmh": hourly.get("wind_speed_10m", [0])[0],
                    "cloud_cover_percent": hourly.get("cloud_cover", [0])[0],
                    "visibility_m": hourly.get("visibility", [0])[0]
                }
                
                forecast_days = []
                for i in range(min(7, len(daily.get("time", [])))):
                    forecast_days.append({
                        "date": daily.get("time", [])[i] if i < len(daily.get("time", [])) else None,
                        "sunrise": daily.get("sunrise", [])[i] if i < len(daily.get("sunrise", [])) else None,
                        "sunset": daily.get("sunset", [])[i] if i < len(daily.get("sunset", [])) else None,
                        "precipitation_mm": daily.get("precipitation_sum", [])[i] if i < len(daily.get("precipitation_sum", [])) else 0,
                        "max_wind_kmh": daily.get("wind_speed_10m_max", [])[i] if i < len(daily.get("wind_speed_10m_max", [])) else 0
                    })
                
                return str({
                    "current": current,
                    "forecast": forecast_days,
                    "timezone": data.get("timezone", "Unknown")
                })
        except Exception as e:
            return f"Error fetching weather: {str(e)}"
    
    def get_birding_conditions(
        self,
        lat: float,
        lng: float
    ) -> str:
        """
        Analyze weather conditions for birding quality.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Birding conditions rating and recommendations
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lng,
                        "hourly": "temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover,visibility",
                        "daily": "sunrise,sunset",
                        "timezone": "auto",
                        "forecast_days": 1
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                hourly = data.get("hourly", {})
                daily = data.get("daily", {})
                
                # Get morning conditions (around sunrise - hours 6-9)
                morning_temps = hourly.get("temperature_2m", [])[6:10]
                morning_wind = hourly.get("wind_speed_10m", [])[6:10]
                morning_precip = hourly.get("precipitation_probability", [])[6:10]
                morning_clouds = hourly.get("cloud_cover", [])[6:10]
                
                # Calculate averages
                avg_temp = sum(morning_temps) / len(morning_temps) if morning_temps else 15
                avg_wind = sum(morning_wind) / len(morning_wind) if morning_wind else 10
                avg_precip = sum(morning_precip) / len(morning_precip) if morning_precip else 0
                avg_clouds = sum(morning_clouds) / len(morning_clouds) if morning_clouds else 50
                
                # Score birding conditions (0-100)
                score = 100
                
                # Wind penalty (birds less active in high wind)
                if avg_wind > 30:
                    score -= 30
                elif avg_wind > 20:
                    score -= 15
                elif avg_wind > 10:
                    score -= 5
                
                # Precipitation penalty
                if avg_precip > 70:
                    score -= 40
                elif avg_precip > 40:
                    score -= 20
                elif avg_precip > 20:
                    score -= 10
                
                # Cloud cover (some clouds are actually good)
                if avg_clouds > 90:
                    score -= 10
                elif avg_clouds < 20:
                    score -= 5  # Very bright can make birds harder to spot
                
                # Temperature considerations
                if avg_temp < 0 or avg_temp > 35:
                    score -= 15
                elif avg_temp < 5 or avg_temp > 30:
                    score -= 5
                
                # Generate recommendations
                recommendations = []
                if avg_wind > 20:
                    recommendations.append("High winds - look for sheltered areas and woods")
                if avg_precip > 40:
                    recommendations.append("Rain likely - bring waterproof gear, birds may be less active")
                if avg_clouds < 20:
                    recommendations.append("Clear skies - best viewing around dawn/dusk to avoid glare")
                if avg_temp < 10:
                    recommendations.append("Cool morning - birds may be active feeding early")
                if avg_temp > 25:
                    recommendations.append("Warm day - focus on early morning and late afternoon")
                
                # Rating
                if score >= 80:
                    rating = "Excellent"
                elif score >= 60:
                    rating = "Good"
                elif score >= 40:
                    rating = "Fair"
                else:
                    rating = "Poor"
                
                sunrise = daily.get("sunrise", ["06:00"])[0] if daily.get("sunrise") else "06:00"
                sunset = daily.get("sunset", ["18:00"])[0] if daily.get("sunset") else "18:00"
                
                return str({
                    "score": max(0, min(100, score)),
                    "rating": rating,
                    "conditions": {
                        "temperature_c": round(avg_temp, 1),
                        "wind_speed_kmh": round(avg_wind, 1),
                        "precipitation_chance": round(avg_precip, 1),
                        "cloud_cover_percent": round(avg_clouds, 1)
                    },
                    "sunrise": sunrise,
                    "sunset": sunset,
                    "best_times": [
                        f"Dawn chorus: {sunrise}",
                        f"Golden hour: {sunset}"
                    ],
                    "recommendations": recommendations if recommendations else ["Great conditions for birding!"]
                })
        except Exception as e:
            return f"Error analyzing birding conditions: {str(e)}"
