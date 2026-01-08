
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
console.log(`🔌 Connecting to: ${connectionString}`);

async function testConnection() {
  const sql = postgres(connectionString!, {
    ssl: false,
    connect_timeout: 5,
  });

  try {
    const result = await sql`SELECT 1+1 as result`;
    console.log('✅ Connection Successful:', result);
    
    const users = await sql`SELECT count(*) FROM users`;
    console.log('📊 Users Count:', users);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed:', error);
    process.exit(1);
  }
}

testConnection();
