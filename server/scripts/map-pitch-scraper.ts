import { PrismaClient, SportType, VerificationStatus, PitchActiveStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface CampusTarget {
  schoolName: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

const CAMPUSES: CampusTarget[] = [
  { schoolName: 'UNILAG (Akoka)', lat: 6.5173, lng: 3.3869, radiusMeters: 4000 },
  { schoolName: 'University of Ibadan (UI)', lat: 7.4443, lng: 3.8996, radiusMeters: 4000 },
  { schoolName: 'OAU (Ile-Ife)', lat: 7.5186, lng: 4.5245, radiusMeters: 4000 },
  { schoolName: 'ABU (Zaria)', lat: 11.1524, lng: 7.6493, radiusMeters: 4000 },
  { schoolName: 'UNN (Nsukka)', lat: 6.8659, lng: 7.4116, radiusMeters: 4000 },
  { schoolName: 'Covenant University (Ota)', lat: 6.6718, lng: 3.1581, radiusMeters: 3500 },
  { schoolName: 'UNILORIN (Ilorin)', lat: 8.4799, lng: 4.6716, radiusMeters: 4000 },
  { schoolName: 'UNIBEN (Ugbowo)', lat: 6.3999, lng: 5.6145, radiusMeters: 4000 },
  { schoolName: 'BUK (New Campus)', lat: 11.9782, lng: 8.4234, radiusMeters: 4000 },
  { schoolName: 'FUT Minna (Gidan Kwano)', lat: 9.5332, lng: 6.4468, radiusMeters: 4000 },
  { schoolName: 'UNIZIK (Awka)', lat: 6.2443, lng: 7.1169, radiusMeters: 4000 },
  { schoolName: 'COOU (Igbariam)', lat: 6.3768, lng: 6.9422, radiusMeters: 4000 },
  { schoolName: 'COOU (Uli)', lat: 5.7876, lng: 6.8702, radiusMeters: 4000 },
  { schoolName: 'Fed Poly Oko', lat: 6.0428, lng: 7.0863, radiusMeters: 4000 },
  { schoolName: 'Paul University (Awka)', lat: 6.2201, lng: 7.0689, radiusMeters: 3000 },
  { schoolName: 'Tansian University (Umunya)', lat: 6.1952, lng: 6.9012, radiusMeters: 3000 },
  { schoolName: 'Madonna University (Okija)', lat: 5.8923, lng: 6.8378, radiusMeters: 3000 },
];

interface ScrapedPitch {
  name: string;
  sportType: SportType;
  fieldType: string;
  priceBracket: string;
  landmarkDescription: string;
  lat: number;
  lng: number;
}

// 1. Fetch from Google Places API if key is available
async function fetchFromGooglePlaces(campus: CampusTarget, apiKey: string): Promise<ScrapedPitch[]> {
  const results: ScrapedPitch[] = [];
  const queries = ['football pitch', 'basketball court', 'sports stadium'];

  for (const query of queries) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${campus.lat},${campus.lng}&radius=${campus.radiusMeters}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json() as any;

      if (data.results && Array.isArray(data.results)) {
        for (const place of data.results) {
          const name = place.name;
          const isBasketball = query.includes('basketball') || name.toLowerCase().includes('basketball') || name.toLowerCase().includes('court');
          results.push({
            name,
            sportType: isBasketball ? SportType.BASKETBALL : SportType.FOOTBALL,
            fieldType: isBasketball ? 'Street Arena' : 'School Ground',
            priceBracket: 'Free',
            landmarkDescription: place.vicinity || `Near ${campus.schoolName} coordinates [${place.geometry?.location?.lat}, ${place.geometry?.location?.lng}]`,
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng,
          });
        }
      }
    } catch (err) {
      console.warn(`[Google Places] Error querying ${query} for ${campus.schoolName}:`, err);
    }
  }

  return results;
}

// 2. Fetch from OpenStreetMap Overpass API (Default: Free & Instant)
async function fetchFromOverpass(campus: CampusTarget): Promise<ScrapedPitch[]> {
  const query = `
    [out:json][timeout:30];
    (
      node["leisure"="pitch"](around:${campus.radiusMeters},${campus.lat},${campus.lng});
      way["leisure"="pitch"](around:${campus.radiusMeters},${campus.lat},${campus.lng});
      node["leisure"="sports_centre"](around:${campus.radiusMeters},${campus.lat},${campus.lng});
      way["leisure"="sports_centre"](around:${campus.radiusMeters},${campus.lat},${campus.lng});
      node["leisure"="stadium"](around:${campus.radiusMeters},${campus.lat},${campus.lng});
      way["leisure"="stadium"](around:${campus.radiusMeters},${campus.lat},${campus.lng});
    );
    out center tags;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'InsideLifeApp/1.0 (sport-mapping)'
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) continue;

      const data = await res.json() as any;
      if (!data.elements || !Array.isArray(data.elements)) return [];

      const results: ScrapedPitch[] = [];
      let unnamedIndex = 1;

      for (const el of data.elements) {
        const tags = el.tags || {};
        const lat = el.lat || el.center?.lat;
        const lng = el.lon || el.center?.lon;
        if (!lat || !lng) continue;

        const sport = (tags.sport || '').toLowerCase();
        const rawName = tags.name || tags['name:en'] || '';
        const isBasketball = sport.includes('basketball') || rawName.toLowerCase().includes('basketball') || rawName.toLowerCase().includes('court');
        
        const sportType = isBasketball ? SportType.BASKETBALL : SportType.FOOTBALL;
        const defaultTitle = isBasketball ? `Campus Basketball Court #${unnamedIndex++}` : `Community Pitch #${unnamedIndex++}`;
        const name = rawName ? rawName : `${campus.schoolName.split(' ')[0]} ${defaultTitle}`;

        results.push({
          name,
          sportType,
          fieldType: tags.surface === 'artificial_turf' ? 'Paid Turf' : (isBasketball ? 'Street Arena' : 'School Ground'),
          priceBracket: tags.fee === 'yes' ? '₦1,000 per head' : 'Free',
          landmarkDescription: tags['addr:street'] 
            ? `Located at ${tags['addr:street']}, around ${campus.schoolName}.`
            : `Campus athletic grounds near coordinates [${lat.toFixed(4)}, ${lng.toFixed(4)}].`,
          lat,
          lng,
        });
      }

      return results;
    } catch (err) {
      console.warn(`[Overpass] Attempt on ${endpoint} failed, trying next...`);
    }
  }

  return [];
}

async function main() {
  console.log('🗺️ Starting Map Pitch & Court Scraper across Nigerian Campuses...');
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

  if (googleApiKey) {
    console.log('🔑 Google Places API Key detected! Querying Google Maps + OpenStreetMap...');
  } else {
    console.log('🌐 No Google Maps API key provided. Using OpenStreetMap Overpass satellite mapping (100% free)...');
  }

  let totalDiscovered = 0;
  let totalSaved = 0;

  for (const campus of CAMPUSES) {
    console.log(`\n🔍 Scanning campus: ${campus.schoolName} (${campus.lat}, ${campus.lng})...`);
    
    // Find or create school record
    const school = await prisma.school.upsert({
      where: { name: campus.schoolName },
      update: {},
      create: {
        name: campus.schoolName,
        institutionType: 'University / Higher Institution',
      },
    });

    let pitches: ScrapedPitch[] = [];

    // Query Google Places if key exists
    if (googleApiKey) {
      const gPitches = await fetchFromGooglePlaces(campus, googleApiKey);
      pitches.push(...gPitches);
    }

    // Query OpenStreetMap
    const osmPitches = await fetchFromOverpass(campus);
    pitches.push(...osmPitches);

    console.log(`📍 Found ${pitches.length} mapped sports spots for ${campus.schoolName}`);
    totalDiscovered += pitches.length;

    // Deduplicate and save to Neon DB
    for (const p of pitches) {
      const existing = await prisma.pitch.findFirst({
        where: {
          schoolId: school.id,
          name: p.name,
        },
      });

      if (!existing) {
        await prisma.pitch.create({
          data: {
            name: p.name,
            schoolId: school.id,
            sportType: p.sportType,
            fieldType: p.fieldType,
            priceBracket: p.priceBracket,
            landmarkDescription: p.landmarkDescription,
            latitude: p.lat,
            longitude: p.lng,
            verificationStatus: VerificationStatus.GHOST,
            confirmationCount: 1,
            activeStatus: PitchActiveStatus.UNKNOWN,
          },
        });
        totalSaved++;
      }
    }

    // Polite delay between campus requests
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n🎉 Scraper Complete!`);
  console.log(`📊 Discovered: ${totalDiscovered} pitches & courts`);
  console.log(`💾 Saved to Database: ${totalSaved} new real-world venues`);
}

main()
  .catch((e) => {
    console.error('❌ Scraper error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
