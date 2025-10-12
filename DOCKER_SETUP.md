# SAFT ERP Docker Setup Guide

This guide explains how to run the SAFT ERP application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Git

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Saft
   ```

2. **Set up environment variables**:
   ```bash
   cp docker.env.example .env
   # Edit .env with your actual configuration values
   ```

3. **Build and start the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

## Environment Configuration

### Required Environment Variables

Before running the application, you need to configure the following environment variables in your `.env` file:

#### Firebase Configuration
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Your Firebase service account private key
- `FIREBASE_CLIENT_EMAIL`: Your Firebase service account email

#### Supabase Configuration
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `DATABASE_URL`: Your PostgreSQL connection string

#### Security
- `JWT_SECRET`: A strong secret key for JWT token signing

#### Email (Optional)
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file and extract the required values

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/public key
5. Go to Settings > Database to get the connection string

## Docker Commands

### Basic Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs saft-frontend
docker-compose logs saft-backend

# Restart a specific service
docker-compose restart saft-backend

# Rebuild a specific service
docker-compose up --build saft-frontend
```

### Development Commands

```bash
# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.override.yml up

# Run in development mode with hot reloading
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

### Maintenance Commands

```bash
# Remove all containers and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clean up unused Docker resources
docker system prune -a

# View resource usage
docker stats
```

## Service Details

### Frontend Service (saft-frontend)
- **Port**: 3000
- **Technology**: React + Vite + Nginx
- **Health Check**: http://localhost:3000/health
- **Features**:
  - Multi-stage build for optimized production image
  - Nginx for serving static files
  - Gzip compression
  - Security headers
  - Client-side routing support

### Backend Service (saft-backend)
- **Port**: 5000
- **Technology**: Node.js + Express
- **Health Check**: http://localhost:5000/health
- **Features**:
  - PDF generation with Puppeteer
  - Firebase/Firestore integration
  - Supabase PostgreSQL integration
  - JWT authentication
  - Rate limiting
  - CORS support

## File Structure

```
Saft/
├── docker-compose.yml              # Main Docker Compose configuration
├── docker-compose.override.yml     # Development overrides
├── docker.env.example             # Environment variables template
├── .env                           # Your environment variables (create this)
├── frontend/
│   ├── Dockerfile                 # Frontend Docker configuration
│   ├── nginx.conf                 # Nginx configuration
│   └── .dockerignore              # Frontend Docker ignore file
├── backend/
│   ├── Dockerfile                 # Backend Docker configuration
│   └── .dockerignore              # Backend Docker ignore file
└── DOCKER_SETUP.md               # This file
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :5000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Environment variables not loaded**:
   - Ensure `.env` file exists in the root directory
   - Check that variable names match exactly
   - Restart containers after changing environment variables

3. **Build failures**:
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

4. **Database connection issues**:
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure database is accessible from Docker containers

5. **Firebase authentication issues**:
   - Verify Firebase project ID
   - Check private key format (should include newlines)
   - Ensure service account has proper permissions

### Health Checks

Both services include health checks:

- **Frontend**: `wget --no-verbose --tries=1 --spider http://localhost:80/health`
- **Backend**: `node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"`

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f saft-backend
```

## Production Deployment

### Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Secrets**: Use Docker secrets or external secret management
3. **Network**: Use Docker networks for service communication
4. **Updates**: Regularly update base images for security patches

### Performance Optimization

1. **Multi-stage builds**: Already implemented for smaller images
2. **Caching**: Use Docker layer caching for faster builds
3. **Resource limits**: Set appropriate CPU and memory limits
4. **Health checks**: Monitor service health

### Scaling

```bash
# Scale backend service
docker-compose up --scale saft-backend=3

# Use load balancer for multiple backend instances
```

## Support

For issues related to:
- **Docker setup**: Check this documentation
- **Application functionality**: Check the main README.md
- **Database issues**: Check SUPABASE_SETUP.md
- **Firebase issues**: Check firebase-setup-guide.md

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Supabase Documentation](https://supabase.com/docs)


