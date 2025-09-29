// src/utils/geocode.js
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Forward geocode: returns { lat, lng, provider }
export async function geocodeAddress(q) {
    // Try Google (if key provided)
    if (GOOGLE_KEY) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${GOOGLE_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.results.length) {
            const { lat, lng } = data.results[0].geometry.location;
            return { lat, lng, provider: 'google' };
        }
        // fall through to Nominatim if Google didn't resolve
    }
    // Nominatim (free)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=0`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const arr = await res.json();
    if (Array.isArray(arr) && arr.length) {
        return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon), provider: 'nominatim' };
    }
    throw new Error('Address not found');
}

// Haversine distance (miles)
export function distanceMiles(a, b) {
    const toRad = (d) => d * Math.PI / 180;
    const R = 3958.8;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}
