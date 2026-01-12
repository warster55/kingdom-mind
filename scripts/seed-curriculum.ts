import { db } from '@/lib/db';
import { curriculum } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CURRICULUM_DATA = [
  // IDENTITY
  { domain: 'Identity', pillarName: 'Origin', pillarOrder: 1, description: 'Shifting from accidental existence to divine design.', keyTruth: 'You are created, not random.', coreVerse: 'Psalm 139:14' },
  { domain: 'Identity', pillarName: 'Adoption', pillarOrder: 2, description: 'Moving from striving for approval to resting in sonship.', keyTruth: 'You are a Child, not an orphan.', coreVerse: 'Romans 8:15' },
  { domain: 'Identity', pillarName: 'Authority', pillarOrder: 3, description: 'Recognizing your spiritual rank over life\'s chaos.', keyTruth: 'You are a Co-Heir, not a victim.', coreVerse: 'Luke 10:19' },

  // PURPOSE
  { domain: 'Purpose', pillarName: 'Design', pillarOrder: 1, description: 'Understanding your quirks as clues to your calling.', keyTruth: 'Your design reveals your destiny.', coreVerse: 'Ephesians 2:10' },
  { domain: 'Purpose', pillarName: 'Assignment', pillarOrder: 2, description: 'Focusing on who needs you today, not just the distant future.', keyTruth: 'Purpose is service.', coreVerse: '1 Peter 4:10' },
  { domain: 'Purpose', pillarName: 'Season', pillarOrder: 3, description: 'Embracing the timing of where you are planted.', keyTruth: 'Bloom where you are planted.', coreVerse: 'Ecclesiastes 3:1' },

  // MINDSET
  { domain: 'Mindset', pillarName: 'Awareness', pillarOrder: 1, description: 'Observing your thoughts instead of becoming them.', keyTruth: 'You are the thinker, not the thought.', coreVerse: '2 Corinthians 10:5' },
  { domain: 'Mindset', pillarName: 'Captivity', pillarOrder: 2, description: 'Arresting lies before they become strongholds.', keyTruth: 'Lies die when exposed to Truth.', coreVerse: 'John 8:32' },
  { domain: 'Mindset', pillarName: 'Renewal', pillarOrder: 3, description: 'Physically and spiritually rewiring your neural pathways.', keyTruth: 'Transformation happens in the mind.', coreVerse: 'Romans 12:2' },

  // RELATIONSHIPS
  { domain: 'Relationships', pillarName: 'Mirror', pillarOrder: 1, description: 'Realizing you attract who you are.', keyTruth: 'Fix yourself to heal your connections.', coreVerse: 'Matthew 7:3' },
  { domain: 'Relationships', pillarName: 'Boundary', pillarOrder: 2, description: 'Protecting your peace to love others better.', keyTruth: 'Love requires a "No" to protect the "Yes".', coreVerse: 'Proverbs 4:23' },
  { domain: 'Relationships', pillarName: 'Honor', pillarOrder: 3, description: 'Treating people according to their potential.', keyTruth: 'Honor unlocks destiny.', coreVerse: 'Romans 12:10' },

  // VISION
  { domain: 'Vision', pillarName: 'Imagination', pillarOrder: 1, description: 'Dreaming with God beyond "realistic" limits.', keyTruth: 'Faith is the evidence of things unseen.', coreVerse: 'Hebrews 11:1' },
  { domain: 'Vision', pillarName: 'Strategy', pillarOrder: 2, description: 'Building the practical bridge to the dream.', keyTruth: 'A vision without a plan is a hallucination.', coreVerse: 'Habakkuk 2:2' },
  { domain: 'Vision', pillarName: 'Endurance', pillarOrder: 3, description: 'Persisting when the vision delays.', keyTruth: 'Delay is development, not denial.', coreVerse: 'Galatians 6:9' },

  // ACTION
  { domain: 'Action', pillarName: 'The Start', pillarOrder: 1, description: 'Overcoming the paralysis of perfectionism.', keyTruth: 'Courage comes AFTER you move.', coreVerse: 'Joshua 1:9' },
  { domain: 'Action', pillarName: 'The Grind', pillarOrder: 2, description: 'Finding holiness in the mundane daily work.', keyTruth: 'Consistency beats intensity.', coreVerse: 'Colossians 3:23' },
  { domain: 'Action', pillarName: 'The Recovery', pillarOrder: 3, description: 'Learning to fail forward without shame.', keyTruth: 'Failure is data, not death.', coreVerse: 'Proverbs 24:16' },

  // LEGACY
  { domain: 'Legacy', pillarName: 'Investment', pillarOrder: 1, description: 'Shifting from gathering to giving.', keyTruth: 'What you keep is lost; what you give is multiplied.', coreVerse: 'Matthew 6:19' },
  { domain: 'Legacy', pillarName: 'Multiplication', pillarOrder: 2, description: 'Pouring your wisdom into others.', keyTruth: 'Success is doing it; Legacy is teaching it.', coreVerse: '2 Timothy 2:2' },
  { domain: 'Legacy', pillarName: 'Eternity', pillarOrder: 3, description: 'Building for a Kingdom that never ends.', keyTruth: 'Live for the weight of glory.', coreVerse: '2 Corinthians 4:17' },
];

async function seedCurriculum() {
  console.log('🌱 Seeding Curriculum Data...');

  // Clear existing to avoid duplicates
  await db.execute(sql`TRUNCATE TABLE curriculum RESTART IDENTITY CASCADE`);

  await db.insert(curriculum).values(CURRICULUM_DATA);

  console.log(`✅ Successfully seeded ${CURRICULUM_DATA.length} curriculum pillars.`);
}

seedCurriculum().catch((err) => {
  console.error('❌ Curriculum seeding failed!', err);
  process.exit(1);
});