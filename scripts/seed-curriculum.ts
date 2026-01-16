/**
 * Seed the curriculum table with 21 steps (7 domains × 3 pillars)
 * Run with: npx dotenv -e .env.local -- tsx scripts/seed-curriculum.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { curriculum } from '../src/lib/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

// 7 Domains × 3 Pillars = 21 Steps
const CURRICULUM_DATA = [
  // === IDENTITY (Who am I?) ===
  {
    domain: 'identity',
    pillarName: 'Beloved Child',
    pillarOrder: 1,
    description: 'Understanding that your core identity is as a beloved child of God, not defined by achievements, failures, or others\' opinions.',
    keyTruth: 'You are deeply loved and accepted exactly as you are. Your worth is inherent, not earned.',
    coreVerse: 'See what great love the Father has lavished on us, that we should be called children of God! - 1 John 3:1',
  },
  {
    domain: 'identity',
    pillarName: 'New Creation',
    pillarOrder: 2,
    description: 'Recognizing that in Christ, you are made new. The old patterns, shame, and labels no longer define you.',
    keyTruth: 'Your past does not determine your future. You are being renewed day by day.',
    coreVerse: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here! - 2 Corinthians 5:17',
  },
  {
    domain: 'identity',
    pillarName: 'Ambassador',
    pillarOrder: 3,
    description: 'Living as a representative of heaven on earth, carrying divine purpose in every interaction.',
    keyTruth: 'You carry the presence of God wherever you go. Your life is a message.',
    coreVerse: 'We are therefore Christ\'s ambassadors, as though God were making his appeal through us. - 2 Corinthians 5:20',
  },

  // === PURPOSE (Why am I here?) ===
  {
    domain: 'purpose',
    pillarName: 'Unique Design',
    pillarOrder: 1,
    description: 'Discovering that you were intentionally crafted with specific gifts, passions, and experiences for a reason.',
    keyTruth: 'You are not an accident. Your unique combination of traits exists to serve a purpose only you can fulfill.',
    coreVerse: 'For we are God\'s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do. - Ephesians 2:10',
  },
  {
    domain: 'purpose',
    pillarName: 'Kingdom Impact',
    pillarOrder: 2,
    description: 'Understanding that your purpose extends beyond personal fulfillment to eternal significance.',
    keyTruth: 'Your daily choices ripple into eternity. Small faithful acts have kingdom impact.',
    coreVerse: 'Seek first his kingdom and his righteousness, and all these things will be given to you as well. - Matthew 6:33',
  },
  {
    domain: 'purpose',
    pillarName: 'Steward of Gifts',
    pillarOrder: 3,
    description: 'Embracing responsibility to develop and deploy your talents for others\' benefit.',
    keyTruth: 'Your gifts are not for hoarding but for giving. As you give, you receive more.',
    coreVerse: 'Each of you should use whatever gift you have received to serve others. - 1 Peter 4:10',
  },

  // === MINDSET (How do I think?) ===
  {
    domain: 'mindset',
    pillarName: 'Awareness',
    pillarOrder: 1,
    description: 'Learning to observe your thoughts without being controlled by them.',
    keyTruth: 'You are the thinker, not the thought. You can choose which thoughts to engage.',
    coreVerse: 'Be transformed by the renewing of your mind. - Romans 12:2',
  },
  {
    domain: 'mindset',
    pillarName: 'Truth Filter',
    pillarOrder: 2,
    description: 'Developing the habit of testing thoughts against truth before accepting them.',
    keyTruth: 'Not every thought that enters your mind deserves residency. Test everything.',
    coreVerse: 'We take captive every thought to make it obedient to Christ. - 2 Corinthians 10:5',
  },
  {
    domain: 'mindset',
    pillarName: 'Renewal Practice',
    pillarOrder: 3,
    description: 'Building daily rhythms that consistently align your mind with truth.',
    keyTruth: 'Transformation is not an event but a daily practice. Small consistent steps create new neural pathways.',
    coreVerse: 'Whatever is true, whatever is noble, whatever is right... think about such things. - Philippians 4:8',
  },

  // === RELATIONSHIPS (How do I connect?) ===
  {
    domain: 'relationships',
    pillarName: 'Secure Attachment',
    pillarOrder: 1,
    description: 'Understanding that healthy relationships flow from your secure identity in God, not from neediness.',
    keyTruth: 'You relate best to others when you\'re not trying to get your identity from them.',
    coreVerse: 'A friend loves at all times. - Proverbs 17:17',
  },
  {
    domain: 'relationships',
    pillarName: 'Forgiveness',
    pillarOrder: 2,
    description: 'Learning to release others and yourself from the prison of unforgiveness.',
    keyTruth: 'Forgiveness is not approving what happened; it\'s releasing its power over you.',
    coreVerse: 'Forgive as the Lord forgave you. - Colossians 3:13',
  },
  {
    domain: 'relationships',
    pillarName: 'Generative Love',
    pillarOrder: 3,
    description: 'Moving from transactional relationships to ones that multiply goodness.',
    keyTruth: 'The healthiest relationships are those where both parties are giving more than taking.',
    coreVerse: 'Love one another. As I have loved you, so you must love one another. - John 13:34',
  },

  // === VISION (Where am I going?) ===
  {
    domain: 'vision',
    pillarName: 'Dream Recovery',
    pillarOrder: 1,
    description: 'Reconnecting with the God-given dreams that may have been buried under disappointment or practicality.',
    keyTruth: 'The dreams in your heart were planted there for a reason. They deserve examination.',
    coreVerse: 'Where there is no vision, the people perish. - Proverbs 29:18',
  },
  {
    domain: 'vision',
    pillarName: 'Faith Imagination',
    pillarOrder: 2,
    description: 'Learning to see possibilities through the lens of faith rather than limitation.',
    keyTruth: 'Faith sees the invisible and believes the impossible. What you see affects what you can become.',
    coreVerse: 'Now faith is confidence in what we hope for and assurance about what we do not see. - Hebrews 11:1',
  },
  {
    domain: 'vision',
    pillarName: 'Strategic Clarity',
    pillarOrder: 3,
    description: 'Translating vision into clear, actionable direction with discernment.',
    keyTruth: 'Vision without strategy is just a wish. God invites us to plan wisely while trusting Him.',
    coreVerse: 'The plans of the diligent lead to profit. - Proverbs 21:5',
  },

  // === ACTION (What do I do?) ===
  {
    domain: 'action',
    pillarName: 'Holy Courage',
    pillarOrder: 1,
    description: 'Moving from knowing to doing, overcoming the fear that keeps us stuck.',
    keyTruth: 'Courage is not the absence of fear but action in spite of it. God goes before you.',
    coreVerse: 'Be strong and courageous. Do not be afraid... for the Lord your God goes with you. - Deuteronomy 31:6',
  },
  {
    domain: 'action',
    pillarName: 'Faithful Steps',
    pillarOrder: 2,
    description: 'Understanding that massive results come from consistent small actions over time.',
    keyTruth: 'You don\'t need to see the whole staircase. Just take the next step.',
    coreVerse: 'Whoever can be trusted with very little can also be trusted with much. - Luke 16:10',
  },
  {
    domain: 'action',
    pillarName: 'Resilient Persistence',
    pillarOrder: 3,
    description: 'Building the muscle to continue when progress is slow or obstacles arise.',
    keyTruth: 'Setbacks are setups for comebacks. Every failure is a teacher if you let it be.',
    coreVerse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up. - Galatians 6:9',
  },

  // === LEGACY (What will I leave?) ===
  {
    domain: 'legacy',
    pillarName: 'Generational Thinking',
    pillarOrder: 1,
    description: 'Expanding your perspective to consider how your choices affect future generations.',
    keyTruth: 'You are living not just for today but for generations you will never meet.',
    coreVerse: 'A good person leaves an inheritance for their children\'s children. - Proverbs 13:22',
  },
  {
    domain: 'legacy',
    pillarName: 'Multiplication Mindset',
    pillarOrder: 2,
    description: 'Shifting from addition (doing good) to multiplication (empowering others to do good).',
    keyTruth: 'Your greatest legacy is not what you do but who you develop.',
    coreVerse: 'The things you have heard me say... entrust to reliable people who will also be qualified to teach others. - 2 Timothy 2:2',
  },
  {
    domain: 'legacy',
    pillarName: 'Eternal Investment',
    pillarOrder: 3,
    description: 'Living with awareness that some investments pay dividends forever.',
    keyTruth: 'The only things that last forever are God, His Word, and people. Invest accordingly.',
    coreVerse: 'Store up for yourselves treasures in heaven, where moths and vermin do not destroy. - Matthew 6:20',
  },
];

async function seedCurriculum() {
  console.log('Checking existing curriculum data...');

  // Check if data already exists
  const existing = await db.select().from(curriculum);

  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing curriculum entries.`);
    console.log('Clearing old data and re-seeding...');
    await db.delete(curriculum);
  }

  console.log('Seeding 21 curriculum steps...');

  for (const item of CURRICULUM_DATA) {
    await db.insert(curriculum).values(item);
    console.log(`  ✓ ${item.domain} - ${item.pillarName}`);
  }

  console.log('\n✅ Curriculum seeded successfully!');
  console.log('   7 domains × 3 pillars = 21 steps');

  await client.end();
}

seedCurriculum().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
