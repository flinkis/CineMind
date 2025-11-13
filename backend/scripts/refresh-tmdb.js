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
// Default to fetching all pages (null means all pages)
// Set MAX_PAGES to a number to limit, or leave unset/0/null for all pages
const MAX_PAGES = process.env.MAX_PAGES
  ? (process.env.MAX_PAGES === 'all' || process.env.MAX_PAGES === '0' ? null : parseInt(process.env.MAX_PAGES))
  : null; // Default to all pages

if (!API_TOKEN) {
  console.error('❌ API_TOKEN not found in .env file');
  console.log('Please set API_TOKEN in backend/.env file');
  process.exit(1);
}

async function refreshTMDB() {
  try {
    console.log('🔄 Fetching upcoming movies from TMDB...');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    if (MAX_PAGES === null) {
      console.log(`📄 Page: ${PAGE}, Max Pages: ALL (fetching all pages)`);
    } else {
      console.log(`📄 Page: ${PAGE}, Max Pages: ${MAX_PAGES}`);
    }

    const params = {
      api_token: API_TOKEN,
      page: PAGE,
    };

    // Only add maxPages if it's not null (null means fetch all)
    if (MAX_PAGES !== null) {
      params.maxPages = MAX_PAGES;
    } else {
      params.maxPages = 'all'; // Use 'all' string for API endpoint
    }

    const response = await axios.post(
      `${BACKEND_URL}/api/dev/refresh_tmdb`,
      {},
      { params }
    );

    console.log('✅ Success!');
    console.log('📊 Stats:');
    console.log(`   Pages Fetched: ${response.data.stats.pagesFetched || 0}`);
    console.log(`   Total Pages: ${response.data.stats.totalPages || 'unknown'}`);
    console.log(`   Total Fetched: ${response.data.stats.totalFetched || 0}`);
    console.log(`   Total Processed (new): ${response.data.stats.totalProcessed || 0}`);
    console.log(`   Total Updated: ${response.data.stats.totalUpdated || 0}`);
    console.log(`   Total Errors: ${response.data.stats.totalErrors || 0}`);
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

