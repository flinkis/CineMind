import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '..', '.env');

// Load .env file
dotenv.config({ path: envPath });

const API_TOKEN = process.env.API_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const PAGE = process.env.PAGE || 1;
const MAX_PAGES = process.env.MAX_PAGES || 1;

if (!API_TOKEN) {
  console.error('❌ API_TOKEN not found in .env file');
  console.log('Please set API_TOKEN in backend/.env file');
  process.exit(1);
}

async function refreshTMDB() {
  try {
    console.log('🔄 Fetching upcoming movies from TMDB...');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    console.log(`📄 Page: ${PAGE}, Max Pages: ${MAX_PAGES}`);
    
    const response = await axios.post(
      `${BACKEND_URL}/api/dev/refresh_tmdb`,
      {},
      {
        params: {
          api_token: API_TOKEN,
          page: PAGE,
          maxPages: MAX_PAGES,
        },
      }
    );

    console.log('✅ Success!');
    console.log('📊 Stats:');
    console.log(`   Total Fetched: ${response.data.stats.totalFetched}`);
    console.log(`   Total Processed: ${response.data.stats.totalProcessed}`);
    console.log(`   Total Updated: ${response.data.stats.totalUpdated}`);
    console.log(`\n${response.data.message}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

refreshTMDB();

