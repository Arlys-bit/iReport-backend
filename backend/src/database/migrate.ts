import { runMigrations } from './migrations.js';
import { query, closePool } from './connection.js';

// Run migrations when this script is executed directly
const main = async () => {
  try {
    await runMigrations();
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await closePool();
    process.exit(0);
  }
};

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runMigrations };
