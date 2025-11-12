# CineMind API Examples

This document provides examples of how to use the CineMind API endpoints.

## Prerequisites

- Backend server running on `http://localhost:3001`
- API token set in backend `.env` file
- TMDB API key set in backend `.env` file
- OpenAI API key set in backend `.env` file

## API Endpoints

### 1. Health Check

Check if the API is running:

```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "CineMind API is running"
}
```

### 2. Search Movies

Search for movies by title:

```bash
curl "http://localhost:3001/api/search/movies?q=inception"
```

**Response:**
```json
{
  "results": [
    {
      "tmdbId": 27205,
      "title": "Inception",
      "overview": "Cobb, a skilled thief...",
      "posterPath": "https://image.tmdb.org/t/p/w500/...",
      "releaseDate": "2010-07-16",
      "popularity": 85.123,
      "voteAverage": 8.8
    }
  ],
  "page": 1,
  "totalPages": 1,
  "totalResults": 1
}
```

### 3. Like a Movie

Add a movie to your liked list (this will compute and store its embedding):

```bash
curl -X POST http://localhost:3001/api/dev/user_like \
  -H "Content-Type: application/json" \
  -d '{"tmdbId": 27205}'
```

**Response:**
```json
{
  "message": "Movie added to liked list",
  "movie": {
    "id": "clx123...",
    "tmdbId": 27205,
    "title": "Inception",
    "overview": "Cobb, a skilled thief...",
    "posterPath": "https://image.tmdb.org/t/p/w500/...",
    "releaseDate": "2010-07-16",
    "embedding": "[0.123, -0.456, ...]",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Refresh Upcoming Movies

Fetch upcoming movies from TMDB and compute embeddings (requires API token):

```bash
curl -X POST "http://localhost:3001/api/dev/refresh_tmdb?api_token=YOUR_TOKEN&page=1&maxPages=1"
```

**Response:**
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

**Note:** This endpoint may take a while as it computes embeddings for each movie.

### 5. Get Recommendations (RSS Feed)

Get personalized movie recommendations as RSS feed (requires API token):

```bash
curl "http://localhost:3001/api/rss/recommendations?api_token=YOUR_TOKEN&limit=20"
```

**Response:** RSS XML feed

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CineMind Movie Recommendations</title>
    <link>https://cinemind.app</link>
    <description>Personalized movie recommendations based on your taste</description>
    <language>en-us</language>
    <lastBuildDate>Mon, 01 Jan 2024 00:00:00 GMT</lastBuildDate>
    <item>
      <title>Movie Title</title>
      <description>Movie overview...

Similarity Score: 85.23%
Release Date: 2024-01-15</description>
      <link>https://www.themoviedb.org/movie/12345</link>
      <guid isPermaLink="false">cinemind:12345</guid>
      <pubDate>Mon, 15 Jan 2024 00:00:00 GMT</pubDate>
      <enclosure url="https://image.tmdb.org/t/p/w500/..." type="image/jpeg"/>
    </item>
  </channel>
</rss>
```

## Using with Radarr

1. Get your RSS feed URL:
   ```
   http://localhost:3001/api/rss/recommendations?api_token=YOUR_TOKEN&limit=20
   ```

2. In Radarr:
   - Go to Settings → Lists
   - Click "+" to add a new list
   - Select "RSS List"
   - Enter the RSS URL
   - Save

3. Radarr will periodically check the RSS feed and add recommended movies to your collection.

## Authentication

Some endpoints require an API token:

- `/api/dev/refresh_tmdb` (POST)
- `/api/rss/recommendations` (GET)

You can pass the token in two ways:

1. **Query parameter:**
   ```
   ?api_token=YOUR_TOKEN
   ```

2. **Header:**
   ```
   X-API-Token: YOUR_TOKEN
   ```

## Error Responses

### 400 Bad Request
```json
{
  "error": "tmdbId is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or missing API token"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to compute embedding: ..."
}
```

## Workflow Example

1. **Search for movies you like:**
   ```bash
   curl "http://localhost:3001/api/search/movies?q=the matrix"
   ```

2. **Like a movie:**
   ```bash
   curl -X POST http://localhost:3001/api/dev/user_like \
     -H "Content-Type: application/json" \
     -d '{"tmdbId": 603}'
   ```

3. **Refresh upcoming movies:**
   ```bash
   curl -X POST "http://localhost:3001/api/dev/refresh_tmdb?api_token=YOUR_TOKEN"
   ```

4. **Get recommendations:**
   ```bash
   curl "http://localhost:3001/api/rss/recommendations?api_token=YOUR_TOKEN&limit=10"
   ```

## Rate Limiting

- TMDB API: Rate limits apply (check TMDB documentation)
- OpenAI API: Rate limits apply (check OpenAI documentation)
- The backend does not implement rate limiting (consider adding for production)

## Notes

- Embeddings are computed using OpenAI's `text-embedding-ada-002` model
- Similarity is computed using cosine similarity
- The taste vector is the average of all liked movie embeddings
- Recommendations are sorted by similarity score (highest first)

