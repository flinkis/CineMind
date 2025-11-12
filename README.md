# CineMind 🎬

A personalized movie recommender system that learns your taste and finds both existing and upcoming movies you'll probably enjoy.

## Features

- 🔍 **Search Movies**: Search The Movie Database (TMDB) for movies
- ❤️ **Like Movies**: Build your taste profile by liking movies
- 🤖 **AI-Powered**: Uses OpenAI embeddings to understand your preferences
- 📊 **Personalized Recommendations**: Get movie recommendations based on your taste
- 📡 **RSS Feed**: Radarr-compatible RSS feed for automated movie discovery
- 🎨 **Modern UI**: Beautiful, responsive dark-themed interface

## Tech Stack

- **Frontend**: React + Vite + styled-components
- **Backend**: Node.js + Express
- **Database**: SQLite via Prisma
- **APIs**: TMDB (movie metadata), OpenAI (embeddings)
- **RSS**: Radarr-compatible XML feed

## Quick Start

### Prerequisites

- Node.js (v18+)
- TMDB API key ([Get one here](https://www.themoviedb.org/settings/api))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd cinemind
```

2. Install dependencies:

```bash
npm run install:all
```

3. Set up backend:

```bash
cd backend
cp env.example .env
# Edit .env and add your API keys
npm run prisma:generate
npm run prisma:migrate
```

4. Start the servers:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. Open http://localhost:3000 in your browser

## Usage

1. **Build Your Taste Profile**: Search for movies and click the ❤️ button on movies you like
2. **Refresh Upcoming Movies**: Call the refresh endpoint to fetch upcoming movies from TMDB
3. **Get Recommendations**: View personalized recommendations on the Recommendations page
4. **Use with Radarr**: Copy the RSS URL and add it to Radarr for automated movie discovery

## API Endpoints

### POST `/api/dev/user_like`
Add a movie to your liked list.

**Body:**
```json
{
  "tmdbId": 12345
}
```

### POST `/api/dev/refresh_tmdb`
Fetch and process upcoming movies from TMDB.

**Query params:**
- `api_token`: API token (required)
- `page`: Page number (default: 1)
- `maxPages`: Maximum pages (default: 1)

### GET `/api/search/movies`
Search movies by title.

**Query params:**
- `q`: Search query (required)
- `page`: Page number (default: 1)

### GET `/api/rss/recommendations`
Get recommendations as RSS feed.

**Query params:**
- `api_token`: API token (required)
- `limit`: Number of recommendations (default: 20)

## How It Works

1. **Taste Profile**: When you like a movie, the system computes an embedding using OpenAI's text-embedding-ada-002 model
2. **Taste Vector**: Your taste profile is the average of all your liked movie embeddings
3. **Similarity**: The system computes cosine similarity between your taste vector and upcoming movies
4. **Recommendations**: Movies are ranked by similarity score and returned as recommendations

## Project Structure

```
cinemind/
├── backend/          # Node.js + Express backend
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   └── server.js # Main server
│   └── prisma/       # Database schema
├── frontend/         # React + Vite frontend
│   └── src/
│       ├── components/ # React components
│       ├── pages/      # Page components
│       └── theme.js    # Styled-components theme
└── setup.md          # Detailed setup guide
```

## Documentation

See [setup.md](./setup.md) for detailed setup instructions and troubleshooting.

## License

This project is for educational purposes.

