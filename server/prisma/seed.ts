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
    { name: 'Madonna Okija Field', fieldType: 'School Ground', priceBracket: 'Free', schoolId: madonna.id, landmarkDescription: 'Sports ground near the law faculty in the Okija campus.' }
  ];

  for (const pitch of pitches) {
    await prisma.pitch.create({ data: pitch });
  }

  console.log(`✅ Created ${pitches.length} sample pitches across Anambra schools`);
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
