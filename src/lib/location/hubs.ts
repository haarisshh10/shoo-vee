export type CityHub = {
  city: string;
  latitude: number;
  longitude: number;
  neighborhoods: string[];
};

/** Cities the marketplace supports, with coordinates for offline nearest-city detection. */
export const CITY_HUBS: CityHub[] = [
  {
    city: "Mumbai",
    latitude: 19.076,
    longitude: 72.8777,
    neighborhoods: ["Bandra", "Andheri", "Lower Parel", "Colaba", "Juhu"],
  },
  {
    city: "Pune",
    latitude: 18.5204,
    longitude: 73.8567,
    neighborhoods: ["Koregaon Park", "Baner", "Viman Nagar", "Kothrud"],
  },
  {
    city: "Bangalore",
    latitude: 12.9716,
    longitude: 77.5946,
    neighborhoods: ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar"],
  },
  {
    city: "Delhi NCR",
    latitude: 28.6139,
    longitude: 77.209,
    neighborhoods: ["Gurugram", "Noida", "South Delhi", "Dwarka"],
  },
  {
    city: "Chennai",
    latitude: 13.0827,
    longitude: 80.2707,
    neighborhoods: ["Adyar", "Anna Nagar", "T. Nagar", "Velachery"],
  },
  {
    city: "Hyderabad",
    latitude: 17.385,
    longitude: 78.4867,
    neighborhoods: ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Hitech City"],
  },
  {
    city: "Kolkata",
    latitude: 22.5726,
    longitude: 88.3639,
    neighborhoods: ["Salt Lake", "Ballygunge", "Park Street", "New Town"],
  },
  {
    city: "Goa",
    latitude: 15.2993,
    longitude: 73.8567,
    neighborhoods: ["Panaji", "Anjuna", "Calangute", "Margao"],
  },
];

const EARTH_RADIUS_KM = 6371;
const MAX_NEAREST_KM = 300;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** City whose hub is closest to the coordinates, or `null` when far from every supported hub. */
export function nearestCity(latitude: number, longitude: number) {
  let best: { hub: CityHub; km: number } | null = null;
  for (const hub of CITY_HUBS) {
    const km = distanceKm({ latitude, longitude }, hub);
    if (!best || km < best.km) best = { hub, km };
  }
  if (!best || best.km > MAX_NEAREST_KM) return null;
  return best.hub.city;
}
