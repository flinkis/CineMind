# How to Refresh Upcoming Movies from TMDB

This guide explains how to fetch upcoming movies from TMDB and compute their embeddings for recommendations.

## Prerequisites

1. Backend server must be running
2. API token must be set in `backend/.env` file
3. TMDB API key must be set in `backend/.env` file
4. OpenAI API key must be set in `backend/.env` file (for computing embeddings)

## Method 1: Using the Script (Recommended)

The easiest way to refresh upcoming movies is using the npm script:

```bash
cd backend
npm run refresh:tmdb
```

This script will:
- Read your API token from `backend/.env`
- Call the refresh endpoint
- Display the results

## Method 2: Using curl

You can also use curl directly. First, get your API token from `backend/.env`:

```bash
cd backend
cat .env | grep API_TOKEN
```

Then run the curl command:

```bash
curl -X POST "http://localhost:3001/api/dev/refresh_tmdb?api_token=YOUR_TOKEN&page=1&maxPages=1"
```

Replace `YOUR_TOKEN` with your actual API token from the `.env` file.

### PowerShell (Windows)

```powershell
$token = (Get-Content backend\.env | Select-String "API_TOKEN").ToString().Split("=")[1]
curl -X POST "http://localhost:3001/api/dev/refresh_tmdb?api_token=$token&page=1&maxPages=1"
```

## Method 3: Using the Frontend

You can also add a button in the frontend to trigger the refresh (future enhancement).

## Parameters

- `api_token` (required): Your API token from `backend/.env`
- `page` (optional): Page number to fetch (default: 1)
- `maxPages` (optional): Maximum number of pages to fetch (default: 1)

## What Happens

1. **Fetches upcoming movies** from TMDB (usually 20 movies per page)
2. **Computes embeddings** for each movie using OpenAI
3. **Stores in database** as upcoming movies with embeddings
4. **Updates existing movies** if they already exist

## Example Response

```json
{
  "message": "TMDB movies refreshed",
  "stats": {
    "totalFetched": 20,
    "totalProcessed": 15,
    "totalUpdated": 5
  }
}
```

## Notes

- **OpenAI API Quota**: This endpoint uses OpenAI API to compute embeddings, so make sure you have available quota
- **Rate Limiting**: TMDB and OpenAI have rate limits, so don't fetch too many pages at once
- **Time**: Computing embeddings can take a while, especially for many movies
- **Error Handling**: If a movie fails to process, it will continue with the next one

## Troubleshooting

### Error: "API token not configured"
- Make sure `API_TOKEN` is set in `backend/.env`
- Restart the backend server after updating `.env`

### Error: "Invalid or missing API token"
- Check that your API token matches the one in `backend/.env`
- Make sure there are no extra spaces or quotes

### Error: "OpenAI API quota exceeded"
- Check your OpenAI billing at https://platform.openai.com/account/billing
- Add billing information if needed
- Wait for quota reset if on free tier

### Error: "TMDB API key not configured"
- Make sure `TMDB_API_KEY` is set in `backend/.env`
- Get your API key from https://www.themoviedb.org/settings/api

### No movies fetched
- Check that TMDB API key is valid
- Check backend console for errors
- Verify TMDB has upcoming movies available

## After Refreshing

Once you've refreshed upcoming movies:

1. **Check status**: Go to the Recommendations page and check the status
2. **Like movies**: Like some movies to build your taste profile
3. **Get recommendations**: Recommendations will appear once you have:
   - At least one liked movie
   - At least one upcoming movie with embedding

## Next Steps

After refreshing, you can:
- Like movies on the Discover page
- View recommendations on the Recommendations page
- Copy RSS URL for Radarr integration

