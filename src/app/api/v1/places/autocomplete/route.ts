import { NextRequest, NextResponse } from 'next/server';
import { BANGALORE_HUBS, PlaceSuggestion } from '@/lib/services/places-data';

/**
 * Places Autocomplete API Endpoint
 * If GOOGLE_MAPS_API_KEY is configured in .env.local/AWS Secrets Manager,
 * delegates to Google Places API (New) with India bounding box bias.
 * Otherwise, falls back to zero-cost, high-speed curated Bangalore hub suggestions.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey && query.length >= 3) {
    try {
      const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      googleUrl.searchParams.set('input', query);
      googleUrl.searchParams.set('key', apiKey);
      googleUrl.searchParams.set('components', 'country:in');
      googleUrl.searchParams.set('location', '12.9716,77.5946'); // Bangalore center
      googleUrl.searchParams.set('radius', '40000'); // 40km radius

      const res = await fetch(googleUrl.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.predictions) {
          const suggestions: PlaceSuggestion[] = data.predictions.map((p: any) => ({
            placeId: p.place_id,
            primaryText: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || 'Bangalore, Karnataka',
            lat: 12.9716, // Geocoded in downstream routing
            lng: 77.5946,
          }));
          return NextResponse.json({ suggestions });
        }
      }
    } catch (err) {
      console.warn('Google Places API request failed, falling back to local dataset', err);
    }
  }

  // Curated Bangalore dataset suggestions matching query
  const queryTokens = query.split(/\s+/).filter(Boolean);
  
  const matches = BANGALORE_HUBS.filter((hub) => {
    if (!query) return true;
    const fullText = `${hub.primaryText} ${hub.secondaryText}`.toLowerCase();
    // Return true if any query token matches
    return queryTokens.some((token) => fullText.includes(token));
  });

  return NextResponse.json({
    suggestions: matches.length > 0 ? matches.slice(0, 8) : BANGALORE_HUBS.slice(0, 8),
  });
}
