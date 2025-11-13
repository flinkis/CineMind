import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Try to connect to the database
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if tables exist
    const userLikesTable = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name='UserLike';
    `;
    
    const moviesTable = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name='Movie';
    `;
    
    if (userLikesTable.length > 0 && moviesTable.length > 0) {
      console.log('✅ Database tables already exist');
      console.log('Database is ready to use!');
    } else {
      console.log('⚠️  Tables do not exist. Please run migrations:');
      console.log('   npm run prisma:migrate');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('locked')) {
      console.log('\n⚠️  Database is locked by another process.');
      console.log('Please close any applications that might have the database open:');
      console.log('  - VS Code or other editors');
      console.log('  - Prisma Studio (if running)');
      console.log('  - Any Node processes');
      console.log('\nThen try running: npm run prisma:migrate');
    } else if (error.message.includes('does not exist')) {
      console.log('\nDatabase file does not exist. Running migration...');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: process.cwd() });
        console.log('✅ Database initialized successfully!');
      } catch (migrateError) {
        console.error('❌ Migration failed:', migrateError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();

