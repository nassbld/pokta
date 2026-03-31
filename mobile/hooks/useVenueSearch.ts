import { useState, useEffect } from 'react';

export interface VenueSuggestion {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
}

export function useVenueSearch(query: string) {
  const [results, setResults] = useState<VenueSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          countrycodes: 'fr',
          limit: '6',
          addressdetails: '0',
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { 'User-Agent': 'Pokta/1.0' } }
        );
        const data = await res.json();
        setResults(data.map((item: any) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          name: item.name || item.display_name.split(',')[0],
          lat: item.lat,
          lon: item.lon,
        })));
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // debounce 500ms pour respecter le rate limit Nominatim

    return () => clearTimeout(timeout);
  }, [query]);

  return { results, isLoading };
}
