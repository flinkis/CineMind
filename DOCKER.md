# Docker Setup for CineMind

This guide explains how to run CineMind using Docker on your NAS or any Docker-compatible system.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- TMDB API key
- (Optional) OpenAI API key for recommendations
- (Optional) Radarr/Sonarr API keys and base URLs

## Quick Start

1. **Create environment file:**
   ```bash
   cp backend/env.example .env
   ```

2. **Edit `.env` file with your configuration:**
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here  # Optional
   DATABASE_URL=file:./prisma/dev.db
   
   # Optional: Radarr/Sonarr integration
   RADARR_API_KEY=your_radarr_api_key
   RADARR_BASE_URL=http://radarr.local:7878
   SONARR_API_KEY=your_sonarr_api_key
   SONARR_BASE_URL=http://sonarr.local:8989
   ```

3. **Build and start containers:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/api/health

## Docker Compose Services

### Backend Service
- **Port:** 3001
- **Image:** Built from `backend/Dockerfile`
- **Database:** SQLite (persisted in `backend/prisma/dev.db`)
- **Health Check:** `/api/health` endpoint

### Frontend Service
- **Port:** 3000 (mapped to nginx port 80)
- **Image:** Built from `frontend/Dockerfile`
- **Web Server:** Nginx (Alpine)
- **API Proxy:** Proxies `/api/*` requests to backend

## Configuration

### Environment Variables

All environment variables from `backend/env.example` can be set in your `.env` file or directly in `docker-compose.yml`.

### Network

Both services communicate through a Docker bridge network (`cinemind-network`).

### Volumes

- **Database:** `./backend/prisma/dev.db` is persisted on the host
- **Logs:** `./backend/logs` (optional) for log files

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Stop and remove everything (including volumes)
```bash
docker-compose down -v
```

### Check service health
```bash
docker-compose ps
```

## Database Management

### Run Prisma migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Access Prisma Studio
```bash
docker-compose exec backend npx prisma studio
```

### Backup database
```bash
cp backend/prisma/dev.db backend/prisma/dev.db.backup
```

## Custom Configuration

### Change Ports

Edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 3000 to 8080
  backend:
    ports:
      - "8081:3001"  # Change 3001 to 8081
```

### Use PostgreSQL Instead of SQLite

1. Add PostgreSQL service to `docker-compose.yml`:
```yaml
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=cinemind
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=cinemind
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - cinemind-network

volumes:
  postgres-data:
```

2. Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://cinemind:password@postgres:5432/cinemind
```

3. Update `backend/prisma/schema.prisma` to use PostgreSQL provider.

## Troubleshooting

### Backend won't start
- Check logs: `docker-compose logs backend`
- Verify environment variables are set correctly
- Ensure database file is writable: `chmod 664 backend/prisma/dev.db`

### Frontend can't connect to backend
- Verify both services are on the same network
- Check backend health: `curl http://localhost:3001/api/health`
- Check nginx logs: `docker-compose logs frontend`

### Database migration issues
```bash
docker-compose exec backend npx prisma migrate reset
docker-compose exec backend npx prisma migrate deploy
```

### Rebuild everything from scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Production Considerations

1. **Use environment-specific `.env` files** (never commit `.env`)
2. **Set up proper database backups** (cron job or backup service)
3. **Configure reverse proxy** (nginx, Traefik, etc.) in front of Docker services
4. **Use Docker secrets** for sensitive data in production
5. **Monitor logs** and set up log rotation
6. **Regularly update** Docker images and dependencies

## NAS-Specific Notes

### Synology DSM
- Use Docker package from Package Center
- Place project in `/docker/cinemind/`
- Configure port forwarding if needed
- Set up scheduled database backups

### QNAP
- Use Container Station
- Place project in `/share/Container/cinemind/`
- Configure firewall rules for ports 3000/3001

### Unraid
- Use Docker in Community Applications
- Place project in `/mnt/user/appdata/cinemind/`
- Configure reverse proxy (Nginx Proxy Manager)

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Check Docker and Docker Compose versions
4. Review this documentation

