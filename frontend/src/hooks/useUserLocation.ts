import { useState, useCallback } from 'react'

export interface UserLocation {
  lat: number
  lng: number
  locationName: string
}

/**
 * Fallback: Get approximate location from IP when browser geolocation fails.
 * Uses ipapi.co (free, HTTPS, no API key). Common when browser geolocation
 * returns POSITION_UNAVAILABLE (e.g. Linux without GeoClue, VMs, some browsers).
 */
async function getLocationFromIP(): Promise<UserLocation | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const city = data.city || ''
    const region = data.region || data.region_code || ''
    const country = data.country_name || ''
    const locationName = [city, region].filter(Boolean).join(', ') || country || 'Your location'
    const lat = parseFloat(data.latitude)
    const lng = parseFloat(data.longitude)
    if (isNaN(lat) || isNaN(lng)) return null
    return { lat, lng, locationName }
  } catch {
    return null
  }
}

/**
 * Hook to get user's approximate location (city/state level) via browser Geolocation
 * and reverse geocoding. Falls back to IP-based location when browser geolocation
 * fails (e.g. "Location unavailable" on Linux, VMs, or restricted environments).
 */
export function useUserLocation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getLocation = useCallback(async (): Promise<UserLocation | null> => {
    setLoading(true)
    setError(null)
    try {
    // 1. Try browser geolocation first
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
          })
        })

        const lat = position.coords.latitude
        const lng = position.coords.longitude

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
          {
            headers: {
              Accept: 'application/json',
              'Accept-Language': 'en',
              'User-Agent': 'BirdWatchAI/1.0 (birding app)',
            },
          }
        )

        if (!res.ok) throw new Error('Could not resolve location')

        const data = await res.json()
        const addr = data.address || {}
        const city =
          addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
        const state = addr.state || addr.region || ''
        const country = addr.country || ''
        const locationName =
          [city, state].filter(Boolean).join(', ') || country || 'Your location'

        return { lat, lng, locationName }
      } catch (err) {
        // Permission denied - don't fallback, user explicitly said no
        if (err instanceof GeolocationPositionError && err.code === 1) {
          setError('Location permission denied')
          return null
        }
        // POSITION_UNAVAILABLE or TIMEOUT - try IP fallback
        const ipResult = await getLocationFromIP()
        if (ipResult) {
          return ipResult
        }
        if (err instanceof GeolocationPositionError) {
          switch (err.code) {
            case 2:
              setError(
                'Location unavailable. Try entering your zip code instead, or ensure location services are enabled.'
              )
              break
            case 3:
              setError('Location request timed out. Try entering your zip code instead.')
              break
            default:
              setError('Could not get location. Please enter your zip code.')
          }
        } else {
          setError('Could not get location. Please enter your zip code.')
        }
        return null
      }
    }

    // 2. No geolocation API - try IP fallback
    const ipResult = await getLocationFromIP()
    if (ipResult) return ipResult

    setError('Geolocation is not supported. Please enter your zip code.')
    return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { getLocation, loading, error, clearError }
}
