# CineMind Setup Guide

This guide will help you set up and run the CineMind movie recommender system.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- TMDB API key (get one at https://www.themoviedb.org/settings/api)
- OpenAI API key (get one at https://platform.openai.com/api-keys)

## Project Structure

```
cinemind/
├── backend/          # Node.js + Express backend
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic (TMDB, embeddings)
│   │   └── server.js # Main server file
│   └── prisma/       # Database schema
├── frontend/         # React + Vite frontend
│   └── src/
│       ├── components/ # React components
│       ├── pages/      # Page components
│       └── theme.js    # Styled-components theme
└── setup.md          # This file
```

## Setup Steps

### 1. Install Dependencies

From the project root:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Or use the workspace script:

```bash
npm run install:all
```

### 2. Backend Configuration

1. Navigate to the `backend` directory:

```bash
cd backend
```

2. Create a `.env` file (copy from `env.example`):

```bash
cp env.example .env
```

3. Edit `.env` and add your API keys:

```env
PORT=3001

# Get from https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here

# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Generate a secure random token (you can use: openssl rand -hex 32)
API_TOKEN=your_secure_api_token_here
```

4. Initialize the database:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

This will create a SQLite database at `backend/prisma/dev.db`.

### 3. Frontend Configuration

The frontend doesn't require any environment variables (it uses the Vite proxy to communicate with the backend).

However, if you want to run the frontend on a different port or change the proxy target, edit `frontend/vite.config.js`.

### 4. Running the Application

#### Option A: Run Both Services Separately

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

The backend will run on http://localhost:3001

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

The frontend will run on http://localhost:3000

#### Option B: Use the Workspace Script (if configured)

From the project root:

```bash
npm run dev
```

This will start both services concurrently.

## Usage

### 1. Build Your Taste Profile

1. Open the frontend at http://localhost:3000
2. Search for movies you like
3. Click the ❤️ button on movies you enjoy
4. Each liked movie will be stored with its embedding

### 2. Refresh Upcoming Movies

To fetch and process upcoming movies from TMDB:

```bash
curl -X POST http://localhost:3001/api/dev/refresh_tmdb?page=1&maxPages=1
```

Or use the API token if you've set one:

```bash
curl -X POST "http://localhost:3001/api/dev/refresh_tmdb?page=1&maxPages=1&api_token=YOUR_TOKEN"
```

This will:
- Fetch upcoming movies from TMDB
- Compute embeddings for each movie
- Store them in the database

### 3. Get Recommendations

1. Go to the Recommendations page in the frontend
2. Enter your API token
3. Click "Load Recommendations"
4. View your personalized movie recommendations

### 4. Use with Radarr

The RSS feed is compatible with Radarr:

1. Copy the RSS URL from the Recommendations page
2. In Radarr, go to Settings → Lists
3. Add a new "RSS List"
4. Paste the RSS URL
5. Radarr will periodically check for new recommendations

RSS URL format:
```
http://localhost:3001/api/rss/recommendations?api_token=YOUR_TOKEN&limit=20
```

## API Endpoints

### POST `/api/dev/user_like`
Add a movie to the user's liked list.

**Body:**
```json
{
  "tmdbId": 12345
}
```

### POST `/api/dev/refresh_tmdb`
Fetch and process upcoming movies from TMDB.

**Query params:**
- `page`: Page number (default: 1)
- `maxPages`: Maximum pages to fetch (default: 1)

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

1. **Taste Profile**: When you like a movie, the system computes an embedding (vector representation) using OpenAI's text-embedding-ada-002 model.

2. **Taste Vector**: Your taste profile is the average of all your liked movie embeddings.

3. **Similarity**: The system computes cosine similarity between your taste vector and upcoming movies.

4. **Recommendations**: Movies are ranked by similarity score and returned as recommendations.

## Database

The application uses SQLite with Prisma ORM. The database stores:

- **UserLike**: Movies you've liked (with embeddings)
- **Movie**: Upcoming and existing movies (with embeddings)

To view the database:

```bash
cd backend
npm run prisma:studio
```

This will open Prisma Studio in your browser.

## Troubleshooting

### Backend won't start

- Check that `.env` file exists and has valid API keys
- Ensure port 3001 is not in use
- Run `npm run prisma:generate` if you see Prisma errors

### Frontend can't connect to backend

- Ensure the backend is running on port 3001
- Check that the Vite proxy is configured correctly in `frontend/vite.config.js`

### No recommendations

- Make sure you've liked at least one movie
- Run the refresh endpoint to fetch upcoming movies
- Check that embeddings are being computed (check database)

### API token errors

- Ensure `API_TOKEN` is set in backend `.env`
- Use the same token in the frontend and RSS URLs

## Development

### Backend

- Server code: `backend/src/`
- Routes: `backend/src/routes/`
- Services: `backend/src/services/`
- Database schema: `backend/prisma/schema.prisma`

### Frontend

- Components: `frontend/src/components/`
- Pages: `frontend/src/pages/`
- Theme: `frontend/src/theme.js`
- Styles: Styled-components (CSS-in-JS)

## Production Deployment

For production:

1. Set `NODE_ENV=production`
2. Build the frontend: `cd frontend && npm run build`
3. Serve the built files with a static file server
4. Run the backend with a process manager (PM2, etc.)
5. Use a production database (PostgreSQL recommended)
6. Set up proper environment variables
7. Use HTTPS for API tokens

## License

This project is for educational purposes.

