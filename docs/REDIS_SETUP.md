# Redis Setup Guide

This guide walks through setting up a Redis instance for SimTrace production caching and session management.

## Prerequisites

- Redis account (Redis Cloud or Upstash recommended)
- Basic understanding of Redis

## Option 1: Redis Cloud (Recommended)

### Step 1: Create Redis Cloud Account

1. Go to https://redis.com/try-free/
2. Click "Get Started"
3. Complete the registration process
4. Verify your email address

### Step 2: Create a New Database

1. After logging in, click "Create Database"
2. Choose a cloud provider (AWS, GCP, or Azure)
3. Select a region closest to your users
4. Choose database tier:
   - **Free Tier**: 256MB memory, 30 connections (good for development)
   - **Fixed**: Starts at 256MB, $5/month
   - **Annual**: 30% discount for annual commitment
5. Name your database (e.g., "simtrace-production")
6. Click "Activate"

### Step 3: Configure Security Settings

1. Navigate to your database
2. Click "Security" tab
3. Set a strong password
4. Configure IP whitelist:
   - **Allow Access from Anywhere** (0.0.0.0/0) - Not recommended for production
   - **Allow Access from Specific IP Ranges** - Recommended for production
5. Enable TLS/SSL (recommended)

### Step 4: Get Connection Details

1. Navigate to your database
2. Click "Connect" or "General"
3. Copy the connection string

The connection string will look like:
```
redis-<id>.cloud.redislabs.com:<port>
```

### Step 5: Configure Environment Variables

Add the following to your `.env` file or Railway environment variables:

```bash
REDIS_HOST=redis-<id>.cloud.redislabs.com
REDIS_PORT=<port>
REDIS_PASSWORD=<your-password>
```

Or use a single connection string:

```bash
REDIS_URL=redis://:<password>@redis-<id>.cloud.redislabs.com:<port>
```

## Option 2: Upstash (Alternative)

### Step 1: Create Upstash Account

1. Go to https://upstash.com/
2. Click "Start Free"
3. Sign up with GitHub or email
4. Complete the registration process

### Step 2: Create a New Redis Database

1. After logging in, click "Create Database"
2. Choose a region closest to your users
3. Name your database (e.g., "simtrace-production")
4. Click "Create"

### Step 3: Get Connection Details

1. Navigate to your database
2. Click "Connect" or "REST API"
3. Copy the connection details

The connection string will look like:
```
https://<id>.upstash.io
```

### Step 4: Configure Environment Variables

Add the following to your `.env` file or Railway environment variables:

```bash
UPSTASH_REDIS_REST_URL=https://<id>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

## Option 3: Self-Hosted Redis

### Step 1: Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
```

**macOS:**
```bash
brew install redis
```

**Windows:**
Use WSL or Docker:
```bash
docker run -d -p 6379:6379 redis:latest
```

### Step 2: Configure Redis

Edit `/etc/redis/redis.conf`:

```bash
# Set a strong password
requirepass <your-strong-password>

# Bind to specific IP (optional)
bind 127.0.0.1

# Enable TLS (optional)
tls-port 6380
port 6379
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
```

### Step 3: Start Redis

```bash
sudo systemctl start redis
sudo systemctl enable redis
```

### Step 4: Configure Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<your-password>
```

## Step 5: Test Connection

Run the following command to test your connection:

```bash
redis-cli -h <host> -p <port> -a <password> ping
```

Expected output:
```
PONG
```

Or use Node.js:
```bash
node -e "const redis = require('redis'); const client = redis.createClient({ url: process.env.REDIS_URL }); client.connect().then(() => console.log('Connected!')).catch(console.error);"
```

## Step 6: Configure Application

Update your Redis client configuration in the application:

```typescript
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

await client.connect();
```

## Step 7: Enable Persistence (Production Only)

For production, enable Redis persistence:

**AOF (Append Only File):**
```bash
appendonly yes
appendfsync everysec
```

**RDB (Redis Database):**
```bash
save 900 1
save 300 10
save 60 10000
```

## Step 8: Monitor Performance

Monitor Redis metrics:
- Memory usage
- CPU usage
- Connections
- Operations per second
- Hit/Miss ratio
- Latency

## Security Best Practices

- **Never commit credentials to version control**
- Use strong passwords (16+ characters)
- Enable TLS/SSL for production
- Use IP whitelisting
- Regularly rotate passwords
- Disable dangerous commands (FLUSHDB, FLUSHALL, CONFIG)
- Use Redis AUTH
- Enable Redis ACLs (Access Control Lists)

## Cost Optimization

- Use free tiers for development
- Monitor memory usage regularly
- Set up eviction policies:
  - `allkeys-lru` - Evict least recently used keys
  - `volatile-lru` - Evict least recently used keys with TTL
- Use connection pooling
- Compress large values

## Troubleshooting

### Connection Timeout

- Check firewall rules
- Verify host and port
- Ensure Redis is running
- Check IP whitelist settings

### Authentication Failed

- Verify password
- Check AUTH command
- Ensure correct connection string format

### Memory Issues

- Monitor memory usage
- Set max memory limit
- Configure eviction policy
- Delete unused keys

### Performance Issues

- Monitor slow queries
- Use pipelining for bulk operations
- Consider Redis Cluster for scaling
- Use appropriate data structures

## Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [Redis Cloud Documentation](https://docs.redis.com/latest/)
- [Upstash Documentation](https://upstash.com/docs)
- [Redis Best Practices](https://redis.io/topics/best-practices)
