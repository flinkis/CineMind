# CineMind Quick Start Guide

Get up and running with CineMind in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Step 2: Configure Backend

1. Copy the example environment file:
   ```bash
   cd backend
   cp env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   API_TOKEN=your_secure_api_token_here
   ```

   **Get API keys:**
   - TMDB: https://www.themoviedb.org/settings/api
   - OpenAI: https://platform.openai.com/api-keys
   - API Token: Generate with `node scripts/generate-token.js` or use any secure random string

3. Initialize the database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

## Step 3: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 4: Use the Application

1. Open http://localhost:3000 in your browser
2. Search for movies you like
3. Click the ❤️ button on movies you enjoy
4. Refresh upcoming movies (call the API endpoint)
5. View recommendations on the Recommendations page

## Next Steps

- See [setup.md](./setup.md) for detailed documentation
- See [API_EXAMPLES.md](./API_EXAMPLES.md) for API usage examples
- See [README.md](./README.md) for project overview

## Troubleshooting

**Backend won't start:**
- Check that `.env` file exists and has valid API keys
- Ensure port 3001 is not in use
- Run `npm run prisma:generate` if you see Prisma errors

**Frontend can't connect:**
- Ensure backend is running on port 3001
- Check browser console for errors

**No recommendations:**
- Make sure you've liked at least one movie
- Run the refresh endpoint to fetch upcoming movies
- Check that embeddings are being computed

## API Token

Generate a secure API token:
```bash
cd backend
node scripts/generate-token.js
```

Add the generated token to your `.env` file as `API_TOKEN`.

## Refresh Upcoming Movies

To fetch and process upcoming movies:

```bash
curl -X POST "http://localhost:3001/api/dev/refresh_tmdb?api_token=YOUR_TOKEN"
```

Replace `YOUR_TOKEN` with your API token from `.env`.

## Get Recommendations

Visit the Recommendations page in the frontend and enter your API token, or use the RSS feed:

```bash
curl "http://localhost:3001/api/rss/recommendations?api_token=YOUR_TOKEN&limit=20"
```

## Using with Radarr

1. Get your RSS URL from the Recommendations page
2. In Radarr: Settings → Lists → Add RSS List
3. Paste the RSS URL
4. Save

Radarr will periodically check for new recommendations!
