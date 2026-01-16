#!/usr/bin/env npx tsx
/**
 * Toggle Maintenance Mode
 *
 * Usage:
 *   npm run db:maintenance        # Check current status
 *   npm run db:maintenance on     # Enable maintenance mode (disable site)
 *   npm run db:maintenance off    # Disable maintenance mode (enable site)
 *
 * Or run directly:
 *   dotenv -e .env.local -- npx tsx scripts/toggle-maintenance.ts [on|off]
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appConfig } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  const command = process.argv[2]?.toLowerCase();

  try {
    // Get current status
    const result = await db
      .select({ value: appConfig.value, updatedAt: appConfig.updatedAt })
      .from(appConfig)
      .where(eq(appConfig.key, 'site_enabled'))
      .limit(1);

    const currentConfig = result[0]?.value as { enabled?: boolean } | null;
    const currentStatus = currentConfig?.enabled !== false;

    if (!command || command === 'status') {
      // Just show status
      console.log('\n====================================');
      console.log('       Kingdom Mind Site Status      ');
      console.log('====================================\n');
      console.log(`  Status: ${currentStatus ? '✓ ENABLED' : '✗ MAINTENANCE MODE'}`);
      if (result[0]) {
        console.log(`  Last Updated: ${result[0].updatedAt.toISOString()}`);
      } else {
        console.log('  Config: Not set (default: enabled)');
      }
      console.log('\nUsage:');
      console.log('  npm run db:maintenance on   - Enable maintenance mode');
      console.log('  npm run db:maintenance off  - Disable maintenance mode');
      console.log('');
    } else if (command === 'on') {
      // Enable maintenance mode (disable site)
      const newValue = { enabled: false };

      if (result.length === 0) {
        // Insert new config
        await db.insert(appConfig).values({
          key: 'site_enabled',
          value: newValue,
          description: 'When enabled: false, site shows maintenance page',
          updatedAt: new Date(),
        });
      } else {
        // Update existing
        await db
          .update(appConfig)
          .set({ value: newValue, updatedAt: new Date() })
          .where(eq(appConfig.key, 'site_enabled'));
      }

      console.log('\n✗ MAINTENANCE MODE ENABLED');
      console.log('  Site is now showing the maintenance page to all visitors.');
      console.log('  API calls will return 503 Service Unavailable.\n');
    } else if (command === 'off') {
      // Disable maintenance mode (enable site)
      const newValue = { enabled: true };

      if (result.length === 0) {
        // Insert new config
        await db.insert(appConfig).values({
          key: 'site_enabled',
          value: newValue,
          description: 'When enabled: false, site shows maintenance page',
          updatedAt: new Date(),
        });
      } else {
        // Update existing
        await db
          .update(appConfig)
          .set({ value: newValue, updatedAt: new Date() })
          .where(eq(appConfig.key, 'site_enabled'));
      }

      console.log('\n✓ SITE ENABLED');
      console.log('  Site is now accessible to all visitors.\n');
    } else {
      console.error(`Unknown command: ${command}`);
      console.log('Usage: npm run db:maintenance [on|off|status]');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
