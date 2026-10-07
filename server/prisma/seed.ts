import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Anambra Institutions data...');

  // Create schools
  const schools = await Promise.all([
    prisma.school.upsert({ where: { name: 'UNIZIK (Awka)' }, update: {}, create: { name: 'UNIZIK (Awka)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'COOU (Igbariam)' }, update: {}, create: { name: 'COOU (Igbariam)', institutionType: 'State University' } }),
    prisma.school.upsert({ where: { name: 'COOU (Uli)' }, update: {}, create: { name: 'COOU (Uli)', institutionType: 'State University' } }),
    prisma.school.upsert({ where: { name: 'Fed Poly Oko' }, update: {}, create: { name: 'Fed Poly Oko', institutionType: 'Federal Polytechnic' } }),
    prisma.school.upsert({ where: { name: 'Nwafor Orizu COE (Nsugbe)' }, update: {}, create: { name: 'Nwafor Orizu COE (Nsugbe)', institutionType: 'College of Education' } }),
    prisma.school.upsert({ where: { name: 'Paul University (Awka)' }, update: {}, create: { name: 'Paul University (Awka)', institutionType: 'Private University' } }),
    prisma.school.upsert({ where: { name: 'Tansian University (Umunya)' }, update: {}, create: { name: 'Tansian University (Umunya)', institutionType: 'Private University' } }),
    prisma.school.upsert({ where: { name: 'Madonna University (Okija)' }, update: {}, create: { name: 'Madonna University (Okija)', institutionType: 'Private University' } }),
    // Nationwide Expansion
    prisma.school.upsert({ where: { name: 'UNILAG (Akoka)' }, update: {}, create: { name: 'UNILAG (Akoka)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'University of Ibadan (UI)' }, update: {}, create: { name: 'University of Ibadan (UI)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'OAU (Ile-Ife)' }, update: {}, create: { name: 'OAU (Ile-Ife)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'ABU (Zaria)' }, update: {}, create: { name: 'ABU (Zaria)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'UNN (Nsukka)' }, update: {}, create: { name: 'UNN (Nsukka)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'Covenant University (Ota)' }, update: {}, create: { name: 'Covenant University (Ota)', institutionType: 'Private University' } }),
    prisma.school.upsert({ where: { name: 'UNILORIN (Ilorin)' }, update: {}, create: { name: 'UNILORIN (Ilorin)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'UNIBEN (Ugbowo)' }, update: {}, create: { name: 'UNIBEN (Ugbowo)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'BUK (New Campus)' }, update: {}, create: { name: 'BUK (New Campus)', institutionType: 'Federal University' } }),
    prisma.school.upsert({ where: { name: 'FUT Minna (Gidan Kwano)' }, update: {}, create: { name: 'FUT Minna (Gidan Kwano)', institutionType: 'Federal University' } }),
  ]);

  console.log(`✅ Created ${schools.length} schools`);

  const unizik = schools.find(s => s.name === 'UNIZIK (Awka)')!;
  const coouIgb = schools.find(s => s.name === 'COOU (Igbariam)')!;
  const coouUli = schools.find(s => s.name === 'COOU (Uli)')!;
  const fpo = schools.find(s => s.name === 'Fed Poly Oko')!;
  const nocen = schools.find(s => s.name === 'Nwafor Orizu COE (Nsugbe)')!;
  const paul = schools.find(s => s.name === 'Paul University (Awka)')!;
  const tansian = schools.find(s => s.name === 'Tansian University (Umunya)')!;
  const madonna = schools.find(s => s.name === 'Madonna University (Okija)')!;

  const unilag = schools.find(s => s.name === 'UNILAG (Akoka)')!;
  const ui = schools.find(s => s.name === 'University of Ibadan (UI)')!;
  const oau = schools.find(s => s.name === 'OAU (Ile-Ife)')!;
  const abu = schools.find(s => s.name === 'ABU (Zaria)')!;
  const unn = schools.find(s => s.name === 'UNN (Nsukka)')!;
  const covenant = schools.find(s => s.name === 'Covenant University (Ota)')!;
  const unilorin = schools.find(s => s.name === 'UNILORIN (Ilorin)')!;
  const uniben = schools.find(s => s.name === 'UNIBEN (Ugbowo)')!;
  const buk = schools.find(s => s.name === 'BUK (New Campus)')!;
  const futminna = schools.find(s => s.name === 'FUT Minna (Gidan Kwano)')!;

  const pitches = [
    // UNIZIK
    { name: 'UNIZIK Main Bowl', fieldType: 'School Ground', priceBracket: 'Free', schoolId: unizik.id, landmarkDescription: 'Inside Nnamdi Azikiwe University main campus, beside the Senate building.' },
    { name: 'Science Village Pitch', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: unizik.id, landmarkDescription: 'Open field near the Faculty of Science blocks.' },
    { name: 'UNIZIK Girls Hostel Field', fieldType: 'School Ground', priceBracket: 'Free', schoolId: unizik.id, landmarkDescription: 'Behind the main female hostels in UNIZIK campus.' },
    
    // COOU Igbariam
    { name: 'COOU Igbariam Stadium', fieldType: 'School Ground', priceBracket: 'Free', schoolId: coouIgb.id, landmarkDescription: 'Main sports complex inside the Igbariam campus.' },
    { name: 'Hostel A Field', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: coouIgb.id, landmarkDescription: 'Field near the main student hostels.' },
    
    // COOU Uli
    { name: 'Uli Campus Pitch', fieldType: 'School Ground', priceBracket: 'Free', schoolId: coouUli.id, landmarkDescription: 'The central football ground for engineering students at Uli.' },
    
    // Federal Poly Oko
    { name: 'Oko Main Field', fieldType: 'School Ground', priceBracket: 'Free', schoolId: fpo.id, landmarkDescription: 'Inside Federal Polytechnic Oko, close to the admin block.' },
    { name: 'Extension Site Pitch', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: fpo.id, landmarkDescription: 'Located at the extension campus for Oko students.' },
    
    // Nwafor Orizu
    { name: 'NOCEN Sports Ground', fieldType: 'School Ground', priceBracket: 'Free', schoolId: nocen.id, landmarkDescription: 'Main college field in Nsugbe.' },
    
    // Paul University
    { name: 'Paul Uni Chapel Field', fieldType: 'School Ground', priceBracket: 'Free', schoolId: paul.id, landmarkDescription: 'Behind the university chapel in Awka.' },
    
    // Tansian University
    { name: 'Tansian Campus Pitch', fieldType: 'School Ground', priceBracket: 'Free', schoolId: tansian.id, landmarkDescription: 'Main open field in the Umunya campus.' },
    
    // Madonna Okija
    { name: 'Madonna Okija Field', fieldType: 'School Ground', priceBracket: 'Free', schoolId: madonna.id, sportType: 'FOOTBALL', landmarkDescription: 'Sports ground near the law faculty in the Okija campus.' },

    // UNILAG (Akoka)
    { name: 'UNILAG Sports Center', fieldType: 'School Ground', priceBracket: 'Free', schoolId: unilag.id, sportType: 'FOOTBALL', landmarkDescription: 'Main stadium complex near the university gate.' },
    { name: 'UNILAG Indoor Sports Hall', fieldType: 'Paid Turf', priceBracket: 'Paid', schoolId: unilag.id, sportType: 'BASKETBALL', landmarkDescription: 'Main indoor basketball court for UNILAG.' },
    { name: 'Eni-Njoku Hostel Court', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: unilag.id, sportType: 'BASKETBALL', landmarkDescription: 'Basketball and football courts near Eni-Njoku hostel.' },
    { name: 'Moremi Car Park', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: unilag.id, sportType: 'FOOTBALL', landmarkDescription: 'Popular pickup spot near Moremi Hall.' },

    // UI (Ibadan)
    { name: 'Awo Stadium', fieldType: 'School Ground', priceBracket: 'Free', schoolId: ui.id, sportType: 'FOOTBALL', landmarkDescription: 'Main UI stadium near Awolowo Hall.' },
    { name: 'UI SUB Basketball Court', fieldType: 'School Ground', priceBracket: 'Free', schoolId: ui.id, sportType: 'BASKETBALL', landmarkDescription: 'Court right beside the Student Union Building.' },
    { name: 'Zik Hall Pitch', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: ui.id, sportType: 'FOOTBALL', landmarkDescription: 'Open maracana field next to Nnamdi Azikiwe Hall.' },
    { name: 'Indy Hall Court', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: ui.id, sportType: 'BASKETBALL', landmarkDescription: 'Basketball court in Independence Hall.' },

    // OAU (Ile-Ife)
    { name: 'OAU Sports Complex', fieldType: 'School Ground', priceBracket: 'Free', schoolId: oau.id, sportType: 'FOOTBALL', landmarkDescription: 'The massive central sports complex on campus.' },
    { name: 'OAU Sports Complex Indoor Court', fieldType: 'School Ground', priceBracket: 'Free', schoolId: oau.id, sportType: 'BASKETBALL', landmarkDescription: 'Indoor court where varsity matches are played.' },
    { name: 'Awo Hall Maracana', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: oau.id, sportType: 'FOOTBALL', landmarkDescription: 'Legendary gravel pitch near Awolowo Hall.' },
    { name: 'Fajuyi Hall Court', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: oau.id, sportType: 'BASKETBALL', landmarkDescription: 'Basketball court behind Fajuyi Hall.' },

    // ABU (Zaria)
    { name: 'ABU Main Stadium', fieldType: 'School Ground', priceBracket: 'Free', schoolId: abu.id, sportType: 'FOOTBALL', landmarkDescription: 'Main athletic and football stadium in Samaru Campus.' },
    { name: 'ABU Gymnasium Court', fieldType: 'School Ground', priceBracket: 'Free', schoolId: abu.id, sportType: 'BASKETBALL', landmarkDescription: 'Main indoor basketball gym in Samaru.' },
    { name: 'Suleiman Hall Pitch', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: abu.id, sportType: 'FOOTBALL', landmarkDescription: 'Open playing field near Suleiman Hall.' },

    // UNN (Nsukka)
    { name: 'Akanu Ibiam Stadium', fieldType: 'School Ground', priceBracket: 'Free', schoolId: unn.id, sportType: 'FOOTBALL', landmarkDescription: 'Main UNN sports arena.' },
    { name: 'Akanu Ibiam Basketball Court', fieldType: 'School Ground', priceBracket: 'Free', schoolId: unn.id, sportType: 'BASKETBALL', landmarkDescription: 'Outdoor courts inside the stadium complex.' },
    { name: 'Franco Pitch', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: unn.id, sportType: 'FOOTBALL', landmarkDescription: 'Popular field near the Eni-Njoku / Alvan Ikoku (Franco) hostels.' },

    // Covenant University
    { name: 'CU Stadium', fieldType: 'School Ground', priceBracket: 'Free', schoolId: covenant.id, sportType: 'FOOTBALL', landmarkDescription: 'Premium turf and track inside Canaanland.' },
    { name: 'Covenant Indoor Sports Hall', fieldType: 'School Ground', priceBracket: 'Free', schoolId: covenant.id, sportType: 'BASKETBALL', landmarkDescription: 'Premium indoor wood court.' },
    { name: 'PG Hall Court', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: covenant.id, sportType: 'BASKETBALL', landmarkDescription: 'Basketball courts near the postgraduate halls.' },

    // UNILORIN
    { name: 'UNILORIN Main Bowl', fieldType: 'School Ground', priceBracket: 'Free', schoolId: unilorin.id, sportType: 'FOOTBALL', landmarkDescription: 'Main stadium at the permanent site.' },
    { name: 'UNILORIN Indoor Court', fieldType: 'School Ground', priceBracket: 'Free', schoolId: unilorin.id, sportType: 'BASKETBALL', landmarkDescription: 'Main basketball arena.' },
    { name: 'San Rab Arena', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: unilorin.id, sportType: 'FOOTBALL', landmarkDescription: 'Popular off-campus student hub playing field in Tanke.' },

    // UNIBEN
    { name: 'UNIBEN Sports Complex', fieldType: 'School Ground', priceBracket: 'Free', schoolId: uniben.id, sportType: 'FOOTBALL', landmarkDescription: 'Main stadium in Ugbowo Campus.' },
    { name: 'UNIBEN Sports Complex Court', fieldType: 'School Ground', priceBracket: 'Free', schoolId: uniben.id, sportType: 'BASKETBALL', landmarkDescription: 'Outdoor courts in the sports complex.' },
    { name: 'Hall 3 Maracana', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: uniben.id, sportType: 'FOOTBALL', landmarkDescription: 'Legendary rough pitch beside Hall 3.' },

    // BUK
    { name: 'BUK New Campus Stadium', fieldType: 'School Ground', priceBracket: 'Free', schoolId: buk.id, sportType: 'FOOTBALL', landmarkDescription: 'Main stadium at the new site.' },
    { name: 'BUK New Campus Court', fieldType: 'School Ground', priceBracket: 'Free', schoolId: buk.id, sportType: 'BASKETBALL', landmarkDescription: 'Basketball courts near the new stadium.' },
    { name: 'Ramat Hall Pitch', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: buk.id, sportType: 'FOOTBALL', landmarkDescription: 'Field near Ramat hostel in the old campus.' },

    // FUT Minna
    { name: 'Gidan Kwano Sports Complex', fieldType: 'School Ground', priceBracket: 'Free', schoolId: futminna.id, sportType: 'FOOTBALL', landmarkDescription: 'Main arena at the permanent site.' },
    { name: 'Gidan Kwano Basketball Court', fieldType: 'School Ground', priceBracket: 'Free', schoolId: futminna.id, sportType: 'BASKETBALL', landmarkDescription: 'Outdoor courts near the hostels.' },
    { name: 'Bosso Campus Field', fieldType: 'Street Arena', priceBracket: 'Free', schoolId: futminna.id, sportType: 'FOOTBALL', landmarkDescription: 'Playing ground at the older Bosso campus.' },
  ];

  for (const pitch of pitches) {
    await prisma.pitch.create({ data: pitch });
  }

  console.log(`✅ Created ${pitches.length} sample pitches across nationwide schools`);
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
