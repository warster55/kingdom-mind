
import { db, curriculum } from '../lib/db';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pillars = [
  // 1. IDENTITY
  { domain: 'Identity', order: 1, name: 'Origin', desc: 'Shifting from accidental existence to divine design.', truth: 'You are created, not random.', verse: 'Psalm 139:14' },
  { domain: 'Identity', order: 2, name: 'Adoption', desc: 'Moving from striving for approval to resting in sonship.', truth: 'You are a Child, not an orphan.', verse: 'Romans 8:15' },
  { domain: 'Identity', order: 3, name: 'Authority', desc: 'Recognizing your spiritual rank over life\'s chaos.', truth: 'You are a Co-Heir, not a victim.', verse: 'Luke 10:19' },

  // 2. PURPOSE
  { domain: 'Purpose', order: 1, name: 'Design', desc: 'Understanding your quirks as clues to your calling.', truth: 'Your design reveals your destiny.', verse: 'Ephesians 2:10' },
  { domain: 'Purpose', order: 2, name: 'Assignment', desc: 'Focusing on who needs you today, not just the distant future.', truth: 'Purpose is service.', verse: '1 Peter 4:10' },
  { domain: 'Purpose', order: 3, name: 'Season', desc: 'Embracing the timing of where you are planted.', truth: 'Bloom where you are planted.', verse: 'Ecclesiastes 3:1' },

  // 3. MINDSET
  { domain: 'Mindset', order: 1, name: 'Awareness', desc: 'Observing your thoughts instead of becoming them.', truth: 'You are the thinker, not the thought.', verse: '2 Corinthians 10:5' },
  { domain: 'Mindset', order: 2, name: 'Captivity', desc: 'Arresting lies before they become strongholds.', truth: 'Lies die when exposed to Truth.', verse: 'John 8:32' },
  { domain: 'Mindset', order: 3, name: 'Renewal', desc: 'Physically and spiritually rewiring your neural pathways.', truth: 'Transformation happens in the mind.', verse: 'Romans 12:2' },

  // 4. RELATIONSHIPS
  { domain: 'Relationships', order: 1, name: 'Mirror', desc: 'Realizing you attract who you are.', truth: 'Fix yourself to heal your connections.', verse: 'Matthew 7:3' },
  { domain: 'Relationships', order: 2, name: 'Boundary', desc: 'Protecting your peace to love others better.', truth: 'Love requires a "No" to protect the "Yes".', verse: 'Proverbs 4:23' },
  { domain: 'Relationships', order: 3, name: 'Honor', desc: 'Treating people according to their potential.', truth: 'Honor unlocks destiny.', verse: 'Romans 12:10' },

  // 5. VISION
  { domain: 'Vision', order: 1, name: 'Imagination', desc: 'Dreaming with God beyond "realistic" limits.', truth: 'Faith is the evidence of things unseen.', verse: 'Hebrews 11:1' },
  { domain: 'Vision', order: 2, name: 'Strategy', desc: 'Building the practical bridge to the dream.', truth: 'A vision without a plan is a hallucination.', verse: 'Habakkuk 2:2' },
  { domain: 'Vision', order: 3, name: 'Endurance', desc: 'Persisting when the vision delays.', truth: 'Delay is development, not denial.', verse: 'Galatians 12:9' },

  // 6. ACTION
  { domain: 'Action', order: 1, name: 'The Start', desc: 'Overcoming the paralysis of perfectionism.', truth: 'Courage comes AFTER you move.', verse: 'Joshua 1:9' },
  { domain: 'Action', order: 2, name: 'The Grind', desc: 'Finding holiness in the mundane daily work.', truth: 'Consistency beats intensity.', verse: 'Colossians 3:23' },
  { domain: 'Action', order: 3, name: 'The Recovery', desc: 'Learning to fail forward without shame.', truth: 'Failure is data, not death.', verse: 'Proverbs 24:16' },

  // 7. LEGACY
  { domain: 'Legacy', order: 1, name: 'Investment', desc: 'Shifting from gathering to giving.', truth: 'What you keep is lost; what you give is multiplied.', verse: 'Matthew 6:19' },
  { domain: 'Legacy', order: 2, name: 'Multiplication', desc: 'Pouring your wisdom into others.', truth: 'Success is doing it; Legacy is teaching it.', verse: '2 Timothy 2:2' },
  { domain: 'Legacy', order: 3, name: 'Eternity', desc: 'Building for a Kingdom that never ends.', truth: 'Live for the weight of glory.', verse: '2 Corinthians 4:17' },
];

async function seed() {
  console.log('🌱 Seeding Curriculum...');
  
  for (const p of pillars) {
    await db.insert(curriculum).values({
      domain: p.domain,
      pillarName: p.name,
      pillarOrder: p.order,
      description: p.desc,
      keyTruth: p.truth,
      coreVerse: p.verse
    });
    console.log(`✅ Added: ${p.domain} - ${p.name}`);
  }
  
  console.log('🏁 Curriculum Seeded.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
