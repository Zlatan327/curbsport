import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Anambra State data...');

  // Create cities
  const cities = await Promise.all([
    prisma.city.upsert({ where: { name: 'Awka' }, update: {}, create: { name: 'Awka', lgaZone: 'AWKA-SOUTH' } }),
    prisma.city.upsert({ where: { name: 'Onitsha' }, update: {}, create: { name: 'Onitsha', lgaZone: 'ONITSHA-NORTH' } }),
    prisma.city.upsert({ where: { name: 'Nnewi' }, update: {}, create: { name: 'Nnewi', lgaZone: 'NNEWI-NORTH' } }),
    prisma.city.upsert({ where: { name: 'Ekwulobia' }, update: {}, create: { name: 'Ekwulobia', lgaZone: 'AGUATA' } }),
    prisma.city.upsert({ where: { name: 'Agulu' }, update: {}, create: { name: 'Agulu', lgaZone: 'ANAOCHA' } }),
    prisma.city.upsert({ where: { name: 'Nkpor' }, update: {}, create: { name: 'Nkpor', lgaZone: 'ONITSHA-SOUTH' } }),
    prisma.city.upsert({ where: { name: 'Ihiala' }, update: {}, create: { name: 'Ihiala', lgaZone: 'IHIALA' } }),
    prisma.city.upsert({ where: { name: 'Ogidi' }, update: {}, create: { name: 'Ogidi', lgaZone: 'IDEMILI-NORTH' } }),
  ]);

  console.log(`✅ Created ${cities.length} cities`);

  // Find city IDs for seeding pitches
  const awka = cities.find(c => c.name === 'Awka')!;
  const onitsha = cities.find(c => c.name === 'Onitsha')!;
  const nnewi = cities.find(c => c.name === 'Nnewi')!;
  const ekwulobia = cities.find(c => c.name === 'Ekwulobia')!;
  const agulu = cities.find(c => c.name === 'Agulu')!;
  const nkpor = cities.find(c => c.name === 'Nkpor')!;
  const ihiala = cities.find(c => c.name === 'Ihiala')!;
  const ogidi = cities.find(c => c.name === 'Ogidi')!;

  // Seed authentic pitches based on web research
  const pitches = [
    // Awka
    { name: 'Awka City Stadium (Township Stadium)', fieldType: 'Paid Turf', priceBracket: '₦5,000 hourly', cityId: awka.id, landmarkDescription: 'Features a hybrid synthetic turf. Major hub for state matches.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'LIVE', confirmationCount: 15 },
    { name: 'UNIZIK Main Campus Stadium', fieldType: 'School Ground', priceBracket: 'Free', cityId: awka.id, landmarkDescription: 'Inside Nnamdi Azikiwe University, used for SUG and local tournaments.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'UNKNOWN', confirmationCount: 8 },
    { name: 'Paul University Field', fieldType: 'School Ground', priceBracket: 'Free', cityId: awka.id, landmarkDescription: 'Inside Paul University campus, Awka.', verificationStatus: 'GHOST', activeStatus: 'UNKNOWN', confirmationCount: 1 },

    // Onitsha
    { name: 'Chuba Ikpeazu Memorial Stadium', fieldType: 'Paid Turf', priceBracket: '₦2,000 per head', cityId: onitsha.id, landmarkDescription: 'Historical ground for Anambra Pillars, located near the main commercial hub.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'BUILDING', confirmationCount: 12 },
    { name: 'Onitsha Sports Club', fieldType: 'Paid Turf', priceBracket: '₦5,000 hourly', cityId: onitsha.id, landmarkDescription: 'Premium facility inside Onitsha GRA with artificial mini pitches.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'UNKNOWN', confirmationCount: 5 },
    { name: 'Godwin Achebe Mini Stadium', fieldType: 'Street Arena', priceBracket: 'Free', cityId: onitsha.id, landmarkDescription: 'Located in Fegge, Onitsha. Very active on weekends.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'LIVE', confirmationCount: 20 },

    // Nnewi
    { name: 'Ifeanyi Ubah Stadium', fieldType: 'Paid Turf', priceBracket: '₦10,000 hourly', cityId: nnewi.id, landmarkDescription: 'Professional stadium (formerly Gabros International). High quality pitch.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'UNKNOWN', confirmationCount: 30 },
    { name: 'Nnewi High School Field', fieldType: 'School Ground', priceBracket: 'Free', cityId: nnewi.id, landmarkDescription: 'Popular weekend spot for youth teams in Nnewi.', verificationStatus: 'GHOST', activeStatus: 'UNKNOWN', confirmationCount: 2 },

    // Ekwulobia
    { name: 'Solution Stadium Ekwulobia', fieldType: 'Paid Turf', priceBracket: '₦3,000 per set', cityId: ekwulobia.id, landmarkDescription: 'New multi-functional sports and leisure project with natural grass/turf.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'DRY', confirmationCount: 10 },

    // Nkpor
    { name: 'United Primary School Pitch (Nkpor Agu)', fieldType: 'School Ground', priceBracket: 'Free', cityId: nkpor.id, landmarkDescription: 'Used for local grassroots and New Auto Spare Parts Market tournaments.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'BUILDING', confirmationCount: 6 },

    // Agulu
    { name: 'Agulu Lake Tourist Pitch', fieldType: 'Street Arena', priceBracket: 'Free', cityId: agulu.id, landmarkDescription: 'Open area near the Agulu Lake resort, used for casual community sets.', verificationStatus: 'GHOST', activeStatus: 'UNKNOWN', confirmationCount: 1 },

    // Ogidi (Idemili)
    { name: 'Rojenny Tourist Village Stadium', fieldType: 'Paid Turf', priceBracket: '₦5,000 hourly', cityId: ogidi.id, landmarkDescription: 'Located in Oba (Idemili area near Ogidi/Onitsha). Historic sporting village.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'UNKNOWN', confirmationCount: 18 },

    // Additional Grassroots & Local Fields
    { name: 'Coke Center Field (NBC)', fieldType: 'Street Arena', priceBracket: 'Free', cityId: onitsha.id, landmarkDescription: 'Open field located near the Coca-Cola / NBC plant area. Popular for local youth matches.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'LIVE', confirmationCount: 14 },
    { name: 'Washington Memorial Grammar School Field', fieldType: 'School Ground', priceBracket: 'Free', cityId: onitsha.id, landmarkDescription: 'Inside Washington Memorial Grammar School compound, Onitsha.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'UNKNOWN', confirmationCount: 9 },
    { name: 'DMGS (Dennis Memorial) Field', fieldType: 'School Ground', priceBracket: 'Free', cityId: onitsha.id, landmarkDescription: 'Along Awka Road, Onitsha. The primary pitch behind the DMGS school hall.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'BUILDING', confirmationCount: 25 },
    { name: 'Udala FC Training Pitch', fieldType: 'Paid Turf', priceBracket: '₦3,000 per set', cityId: awka.id, landmarkDescription: 'Located in Okpuno area near Awka. Known for Academy training sessions.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'UNKNOWN', confirmationCount: 11 },
    { name: 'Ekwueme Square Open Field', fieldType: 'Street Arena', priceBracket: 'Free', cityId: awka.id, landmarkDescription: 'Open fields around the Dr. Alex Ekwueme Square, Awka. Used by weekend warriors.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'LIVE', confirmationCount: 40 },
    
    // Hyper-Local Community / Hostel Fields
    { name: 'UNIZIK Girls Hostel Field', fieldType: 'School Ground', priceBracket: 'Free', cityId: awka.id, landmarkDescription: 'Located right by the girls hostel (Block A area) inside the UNIZIK campus. Classic local student turf.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'LIVE', confirmationCount: 45 },
    { name: 'Ezenwankwo Field', fieldType: 'Street Arena', priceBracket: 'Free', cityId: onitsha.id, landmarkDescription: 'Located in Ugwuagawa, Obosi. Famous for local grassroots tournaments like Predator Cup.', verificationStatus: 'COMMUNITY_VERIFIED', activeStatus: 'UNKNOWN', confirmationCount: 22 },
    { name: 'Ozalla Academy Field', fieldType: 'Street Arena', priceBracket: 'Free', cityId: onitsha.id, landmarkDescription: 'Awada/Obosi axis. Used by local clubs and the All Stars FC for training.', verificationStatus: 'GHOST', activeStatus: 'UNKNOWN', confirmationCount: 2 },
  ];

  for (const pitch of pitches) {
    await prisma.pitch.create({ data: pitch });
  }

  console.log(`✅ Created ${pitches.length} sample pitches across Anambra`);
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
