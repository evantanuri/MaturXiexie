import { env } from "../config/env";

export interface EnvironmentalConditions {
  temperature_c: number | null;
  rain_mm: number | null;
  european_aqi: number | null;
  pm2_5: number | null;
  source: string;
  is_fallback: boolean;
}

interface CacheEntry {
  data: EnvironmentalConditions;
  expiresAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5_000;
const cache = new Map<string, CacheEntry>();

function buildCacheKey(lat: number, lng: number): string {
  // Round to ~1.1km grid to reuse weather/AQI responses across nearby requests.
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export async function getEnvironmentalConditions(
  lat: number,
  lng: number
): Promise<EnvironmentalConditions> {
  const key = buildCacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,rain`;
  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=european_aqi,pm2_5`;

  const headers = { "User-Agent": env.USER_AGENT };

  const [weatherRes, airRes] = await Promise.allSettled([
    fetch(weatherUrl, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error(`Weather HTTP ${r.status}`))
    ),
    fetch(airQualityUrl, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error(`AQI HTTP ${r.status}`))
    ),
  ]);

  let temperatureC: number | null = null;
  let rainMm: number | null = null;
  let europeanAqi: number | null = null;
  let pm25: number | null = null;
  let anySuccess = false;

  if (weatherRes.status === "fulfilled") {
    const current = (weatherRes.value as { current?: { temperature_2m?: number; rain?: number } })
      .current;
    if (current) {
      temperatureC = typeof current.temperature_2m === "number" ? current.temperature_2m : null;
      rainMm = typeof current.rain === "number" ? current.rain : null;
      anySuccess = true;
    }
  }

  if (airRes.status === "fulfilled") {
    const current = (airRes.value as { current?: { european_aqi?: number; pm2_5?: number } })
      .current;
    if (current) {
      europeanAqi = typeof current.european_aqi === "number" ? current.european_aqi : null;
      pm25 = typeof current.pm2_5 === "number" ? current.pm2_5 : null;
      anySuccess = true;
    }
  }

  const result: EnvironmentalConditions = {
    temperature_c: temperatureC,
    rain_mm: rainMm,
    european_aqi: europeanAqi,
    pm2_5: pm25,
    source: "open-meteo",
    is_fallback: !anySuccess,
  };

  if (anySuccess) {
    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return result;
}
