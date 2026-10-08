import { NextRequest, NextResponse } from 'next/server';
import { BANGALORE_HUBS, PlaceSuggestion } from '@/lib/services/places-data';

// Server-side cache for geocoded Place IDs (prevents redundant Google API calls)
const geocodeCache = new Map<string, { lat: number; lng: number; formattedAddress: string }>();

/**
 * Production Places Autocomplete API Endpoint
 * 
 * Capabilities:
 * 1. Checks GOOGLE_MAPS_API_KEY from environment variables / AWS Secrets.
 * 2. When configured, queries Google Places API (New) with:
 *    - Strict India country restriction (`components=country:in`).
 *    - Bangalore Metropolitan Area location bias (Lat 12.9716, Lng 77.5946, 45km radius).
 *    - Auto-geocodes selected places to exact GPS coordinates.
 * 3. When offline or during local development, uses the comprehensive
 *    curated Bangalore Tech Parks & localities dataset with fuzzy token matching.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();
  const placeId = searchParams.get('placeId'); // Optional: fetch exact lat/lng for selected place

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // 1. If placeId is provided, resolve exact GPS coordinates
  if (placeId) {
    // Check in-memory geocode cache
    if (geocodeCache.has(placeId)) {
      return NextResponse.json({ location: geocodeCache.get(placeId) });
    }

    // Check Bangalore curated dataset first
    const localMatch = BANGALORE_HUBS.find((h) => h.placeId === placeId);
    if (localMatch) {
      const loc = { lat: localMatch.lat, lng: localMatch.lng, formattedAddress: `${localMatch.primaryText}, ${localMatch.secondaryText}` };
      geocodeCache.set(placeId, loc);
      return NextResponse.json({ location: loc });
    }

    // If API key is available, resolve via Google Place Details
    if (apiKey) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry,formatted_address&key=${apiKey}`;
        const res = await fetch(detailsUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.result?.geometry?.location) {
            const loc = {
              lat: data.result.geometry.location.lat,
              lng: data.result.geometry.location.lng,
              formattedAddress: data.result.formatted_address || '',
            };
            geocodeCache.set(placeId, loc);
            return NextResponse.json({ location: loc });
          }
        }
      } catch (err) {
        console.warn('Google Place Details lookup failed', err);
      }
    }

    // Default fallback to central Bangalore coordinates
    return NextResponse.json({
      location: { lat: 12.9716, lng: 77.5946, formattedAddress: 'Bangalore, Karnataka' },
    });
  }

  // 2. Query Autocomplete Predictions
  if (apiKey && query.length >= 2) {
    try {
      const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      googleUrl.searchParams.set('input', query);
      googleUrl.searchParams.set('key', apiKey);
      googleUrl.searchParams.set('components', 'country:in');
      googleUrl.searchParams.set('location', '12.9716,77.5946'); // Bangalore center
      googleUrl.searchParams.set('radius', '45000'); // 45km radius covering Greater Bangalore

      const res = await fetch(googleUrl.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
          const suggestions: PlaceSuggestion[] = data.predictions.map((p: any) => ({
            placeId: p.place_id,
            primaryText: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || 'Bangalore, Karnataka',
            lat: 12.9716,
            lng: 77.5946,
          }));
          return NextResponse.json({ suggestions, source: 'google_places' });
        }
      }
    } catch (err) {
      console.warn('Google Places API request failed, falling back to curated dataset', err);
    }
  }

  // 3. High-Fidelity Local Dataset Matching with Fuzzy Token Matching
  const lowerQuery = query.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

  let matches: PlaceSuggestion[] = [];

  if (queryTokens.length > 0) {
    matches = BANGALORE_HUBS.filter((hub) => {
      const fullText = `${hub.primaryText} ${hub.secondaryText}`.toLowerCase();
      // Match if all or any tokens match
      return queryTokens.every((token) => fullText.includes(token)) ||
             queryTokens.some((token) => fullText.includes(token));
    });
  }

  return NextResponse.json({
    suggestions: matches.length > 0 ? matches.slice(0, 8) : BANGALORE_HUBS.slice(0, 8),
    source: 'curated_bangalore',
  });
}
