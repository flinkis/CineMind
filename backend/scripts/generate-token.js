import crypto from 'crypto';

/**
 * Generate a secure random API token
 * Usage: node scripts/generate-token.js
 */
const token = crypto.randomBytes(32).toString('hex');
console.log('Generated API token:');
console.log(token);
console.log('\nAdd this to your .env file as API_TOKEN=' + token);

