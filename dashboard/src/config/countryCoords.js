// Centroid coordinates for common countries (lat/lng)
// Used by ThreatMap for zero-network geographic plotting
export const COUNTRY_COORDINATES = {
  // North America
  "united states": { lat: 37.0902, lng: -95.7129, name: "United States" },
  "us": { lat: 37.0902, lng: -95.7129, name: "United States" },
  "usa": { lat: 37.0902, lng: -95.7129, name: "United States" },
  "canada": { lat: 56.1304, lng: -106.3468, name: "Canada" },
  "ca": { lat: 56.1304, lng: -106.3468, name: "Canada" },
  "mexico": { lat: 23.6345, lng: -102.5528, name: "Mexico" },
  "mx": { lat: 23.6345, lng: -102.5528, name: "Mexico" },

  // South America
  "brazil": { lat: -14.2350, lng: -51.9253, name: "Brazil" },
  "br": { lat: -14.2350, lng: -51.9253, name: "Brazil" },
  "argentina": { lat: -38.4161, lng: -63.6167, name: "Argentina" },
  "ar": { lat: -38.4161, lng: -63.6167, name: "Argentina" },
  "chile": { lat: -35.6751, lng: -71.5430, name: "Chile" },
  "cl": { lat: -35.6751, lng: -71.5430, name: "Chile" },
  "colombia": { lat: 4.5709, lng: -74.2973, name: "Colombia" },
  "co": { lat: 4.5709, lng: -74.2973, name: "Colombia" },
  "peru": { lat: -9.1900, lng: -75.0152, name: "Peru" },
  "pe": { lat: -9.1900, lng: -75.0152, name: "Peru" },

  // Europe
  "germany": { lat: 51.1657, lng: 10.4515, name: "Germany" },
  "de": { lat: 51.1657, lng: 10.4515, name: "Germany" },
  "united kingdom": { lat: 55.3781, lng: -3.4360, name: "United Kingdom" },
  "uk": { lat: 55.3781, lng: -3.4360, name: "United Kingdom" },
  "gb": { lat: 55.3781, lng: -3.4360, name: "United Kingdom" },
  "france": { lat: 46.2276, lng: 2.2137, name: "France" },
  "fr": { lat: 46.2276, lng: 2.2137, name: "France" },
  "italy": { lat: 41.8719, lng: 12.5674, name: "Italy" },
  "it": { lat: 41.8719, lng: 12.5674, name: "Italy" },
  "spain": { lat: 40.4637, lng: -3.7492, name: "Spain" },
  "es": { lat: 40.4637, lng: -3.7492, name: "Spain" },
  "netherlands": { lat: 52.1326, lng: 5.2913, name: "Netherlands" },
  "nl": { lat: 52.1326, lng: 5.2913, name: "Netherlands" },
  "belgium": { lat: 50.5039, lng: 4.4699, name: "Belgium" },
  "be": { lat: 50.5039, lng: 4.4699, name: "Belgium" },
  "switzerland": { lat: 46.8182, lng: 8.2275, name: "Switzerland" },
  "ch": { lat: 46.8182, lng: 8.2275, name: "Switzerland" },
  "sweden": { lat: 60.1282, lng: 18.6435, name: "Sweden" },
  "se": { lat: 60.1282, lng: 18.6435, name: "Sweden" },
  "norway": { lat: 60.4720, lng: 8.4689, name: "Norway" },
  "no": { lat: 60.4720, lng: 8.4689, name: "Norway" },
  "finland": { lat: 61.9241, lng: 25.7482, name: "Finland" },
  "fi": { lat: 61.9241, lng: 25.7482, name: "Finland" },
  "poland": { lat: 51.9194, lng: 19.1451, name: "Poland" },
  "pl": { lat: 51.9194, lng: 19.1451, name: "Poland" },
  "ukraine": { lat: 48.3794, lng: 31.1656, name: "Ukraine" },
  "ua": { lat: 48.3794, lng: 31.1656, name: "Ukraine" },
  "russia": { lat: 61.5240, lng: 105.3188, name: "Russia" },
  "ru": { lat: 61.5240, lng: 105.3188, name: "Russia" },
  "ireland": { lat: 53.1424, lng: -7.6921, name: "Ireland" },
  "ie": { lat: 53.1424, lng: -7.6921, name: "Ireland" },
  "portugal": { lat: 39.3999, lng: -8.2245, name: "Portugal" },
  "pt": { lat: 39.3999, lng: -8.2245, name: "Portugal" },
  "austria": { lat: 47.5162, lng: 14.5501, name: "Austria" },
  "at": { lat: 47.5162, lng: 14.5501, name: "Austria" },
  "czech republic": { lat: 49.8175, lng: 15.4730, name: "Czech Republic" },
  "cz": { lat: 49.8175, lng: 15.4730, name: "Czech Republic" },
  "romania": { lat: 45.9432, lng: 24.9668, name: "Romania" },
  "ro": { lat: 45.9432, lng: 24.9668, name: "Romania" },
  "denmark": { lat: 56.2639, lng: 9.5018, name: "Denmark" },
  "dk": { lat: 56.2639, lng: 9.5018, name: "Denmark" },

  // Asia / Pacific
  "india": { lat: 20.5937, lng: 78.9629, name: "India" },
  "in": { lat: 20.5937, lng: 78.9629, name: "India" },
  "china": { lat: 35.8617, lng: 104.1954, name: "China" },
  "cn": { lat: 35.8617, lng: 104.1954, name: "China" },
  "japan": { lat: 36.2048, lng: 138.2529, name: "Japan" },
  "jp": { lat: 36.2048, lng: 138.2529, name: "Japan" },
  "south korea": { lat: 35.9078, lng: 127.7669, name: "South Korea" },
  "kr": { lat: 35.9078, lng: 127.7669, name: "South Korea" },
  "singapore": { lat: 1.3521, lng: 103.8198, name: "Singapore" },
  "sg": { lat: 1.3521, lng: 103.8198, name: "Singapore" },
  "taiwan": { lat: 23.6978, lng: 120.9605, name: "Taiwan" },
  "tw": { lat: 23.6978, lng: 120.9605, name: "Taiwan" },
  "hong kong": { lat: 22.3193, lng: 114.1694, name: "Hong Kong" },
  "hk": { lat: 22.3193, lng: 114.1694, name: "Hong Kong" },
  "australia": { lat: -25.2744, lng: 133.7751, name: "Australia" },
  "au": { lat: -25.2744, lng: 133.7751, name: "Australia" },
  "new zealand": { lat: -40.9006, lng: 174.8860, name: "New Zealand" },
  "nz": { lat: -40.9006, lng: 174.8860, name: "New Zealand" },
  "indonesia": { lat: -0.7893, lng: 113.9213, name: "Indonesia" },
  "id": { lat: -0.7893, lng: 113.9213, name: "Indonesia" },
  "malaysia": { lat: 4.2105, lng: 101.9758, name: "Malaysia" },
  "my": { lat: 4.2105, lng: 101.9758, name: "Malaysia" },
  "thailand": { lat: 15.8700, lng: 100.9925, name: "Thailand" },
  "th": { lat: 15.8700, lng: 100.9925, name: "Thailand" },
  "vietnam": { lat: 14.0583, lng: 108.2772, name: "Vietnam" },
  "vn": { lat: 14.0583, lng: 108.2772, name: "Vietnam" },
  "philippines": { lat: 12.8797, lng: 121.7740, name: "Philippines" },
  "ph": { lat: 12.8797, lng: 121.7740, name: "Philippines" },
  "pakistan": { lat: 30.3753, lng: 69.3451, name: "Pakistan" },
  "pk": { lat: 30.3753, lng: 69.3451, name: "Pakistan" },
  "bangladesh": { lat: 23.6850, lng: 90.3563, name: "Bangladesh" },
  "bd": { lat: 23.6850, lng: 90.3563, name: "Bangladesh" },

  // Middle East & Africa
  "israel": { lat: 31.0461, lng: 34.8516, name: "Israel" },
  "il": { lat: 31.0461, lng: 34.8516, name: "Israel" },
  "turkey": { lat: 38.9637, lng: 35.2433, name: "Turkey" },
  "tr": { lat: 38.9637, lng: 35.2433, name: "Turkey" },
  "united arab emirates": { lat: 23.4241, lng: 53.8478, name: "United Arab Emirates" },
  "uae": { lat: 23.4241, lng: 53.8478, name: "United Arab Emirates" },
  "ae": { lat: 23.4241, lng: 53.8478, name: "United Arab Emirates" },
  "saudi arabia": { lat: 23.8859, lng: 45.0792, name: "Saudi Arabia" },
  "sa": { lat: 23.8859, lng: 45.0792, name: "Saudi Arabia" },
  "iran": { lat: 32.4279, lng: 53.6880, name: "Iran" },
  "ir": { lat: 32.4279, lng: 53.6880, name: "Iran" },
  "south africa": { lat: -30.5595, lng: 22.9375, name: "South Africa" },
  "za": { lat: -30.5595, lng: 22.9375, name: "South Africa" },
  "egypt": { lat: 26.8206, lng: 30.8025, name: "Egypt" },
  "eg": { lat: 26.8206, lng: 30.8025, name: "Egypt" },
  "nigeria": { lat: 9.0820, lng: 8.6753, name: "Nigeria" },
  "ng": { lat: 9.0820, lng: 8.6753, name: "Nigeria" },
  "kenya": { lat: -0.0236, lng: 37.9062, name: "Kenya" },
  "ke": { lat: -0.0236, lng: 37.9062, name: "Kenya" },
  "morocco": { lat: 31.7917, lng: -7.0926, name: "Morocco" },
  "ma": { lat: 31.7917, lng: -7.0926, name: "Morocco" }
};

export function getCountryCoordinates(countryInput) {
  if (!countryInput || typeof countryInput !== "string") return null;
  const key = countryInput.trim().toLowerCase();
  return COUNTRY_COORDINATES[key] || null;
}

// Convert lat/lng to SVG viewBox (1000x500) equirectangular coordinates
export function projectCoordinates(lat, lng, width = 1000, height = 500) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

