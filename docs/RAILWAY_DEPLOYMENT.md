# Railway Deployment Guide

This guide walks through deploying the SimTrace backend to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- MongoDB Atlas cluster configured (see [MongoDB Atlas Setup](./MONGODB_ATLAS_SETUP.md))
- Redis instance configured (see [Redis Setup](./REDIS_SETUP.md))
- Git repository with the SimTrace backend code

## Step 1: Create a Railway Account

1. Go to https://railway.app
2. Click "Login" or "Sign Up"
3. Sign up with GitHub, GitLab, or email
4. Complete the registration process
5. Verify your email address

## Step 2: Create a New Project

1. After logging in, click "New Project"
2. Choose one of the following:
   - **Deploy from GitHub repo** (recommended)
   - **Start from scratch**
3. If deploying from GitHub:
   - Authorize Railway to access your repositories
   - Select the `simtrace-FINAL` repository
   - Select the branch to deploy (usually `main`)
4. Click "Deploy Now"

## Step 3: Configure Build Settings

Railway will automatically detect the Node.js project. Verify the build settings:

### Build Command
```bash
cd backend && npm install && npm run build
```

### Start Command
```bash
cd backend && npm start
```

### Working Directory
```
backend
```

## Step 4: Add Environment Variables

Navigate to your project settings and add the following environment variables:

### Database Variables
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/simtrace?retryWrites=true&w=majority
```

### Redis Variables
```bash
REDIS_HOST=redis-<id>.cloud.redislabs.com
REDIS_PORT=<port>
REDIS_PASSWORD=<your-password>
```

Or for Upstash:
```bash
UPSTASH_REDIS_REST_URL=https://<id>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

### Application Variables
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=<your-jwt-secret>
```

### Optional Variables
```bash
SENTRY_DSN=<your-sentry-dsn>
AFRICAS_TALKING_API_KEY=<your-api-key>
AFRICAS_TALKING_USERNAME=<your-username>
SENDGRID_API_KEY=<your-api-key>
```

## Step 5: Configure Database

### MongoDB Atlas IP Whitelist

1. Go to MongoDB Atlas
2. Navigate to "Network Access"
3. Add Railway's IP ranges:
   - Check Railway's documentation for current IP ranges
   - Or use "Allow Access from Anywhere" (not recommended for production)

### Redis IP Whitelist

1. Go to Redis Cloud or Upstash
2. Add Railway's IP ranges to the whitelist
3. Or use "Allow Access from Anywhere" (not recommended for production)

## Step 6: Deploy the Application

1. Click "Deploy" in Railway
2. Railway will:
   - Clone your repository
   - Install dependencies
   - Build the application
   - Start the server
3. Monitor the deployment logs for any errors

## Step 7: Verify Deployment

1. Railway will provide a public URL for your application
2. Test the health endpoint:
   ```bash
   curl https://your-app.railway.app/health
   ```
3. Test API endpoints:
   ```bash
   curl https://your-app.railway.app/api/v1/devices
   ```

## Step 8: Configure Custom Domain (Optional)

1. Navigate to your project settings
2. Click "Domains"
3. Click "Add Domain"
4. Enter your custom domain (e.g., `api.simtrace.com`)
5. Update your DNS records:
   - Type: CNAME
   - Name: api
   - Value: your-app.railway.app
6. Wait for DNS propagation

## Step 9: Enable Automatic Deployments

1. Navigate to your project settings
2. Click "Deployments"
3. Enable "Auto-deploy on push"
4. Select the branch to watch (usually `main`)

## Step 10: Configure Scaling

### Horizontal Scaling

1. Navigate to your project settings
2. Click "Scaling"
3. Configure:
   - **Min instances**: 1 (recommended for production)
   - **Max instances**: 3-5 (depending on traffic)
   - **CPU threshold**: 70%
   - **Memory threshold**: 80%

### Vertical Scaling

Upgrade your plan for more resources:
- **Starter**: $5/month (512MB RAM, 0.5 vCPU)
- **Basic**: $20/month (1GB RAM, 1 vCPU)
- **Standard**: $50/month (2GB RAM, 2 vCPU)

## Step 11: Set Up Monitoring

### Logs

1. Navigate to your project
2. Click "Logs" tab
3. View real-time logs
4. Set up log retention (Railway retains logs for 7 days by default)

### Metrics

1. Navigate to your project
2. Click "Metrics" tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Network I/O
   - Disk usage

### Alerts

1. Navigate to your project settings
2. Click "Notifications"
3. Configure alerts for:
   - Deployment failures
   - High CPU usage
   - High memory usage
   - Application crashes

## Step 12: Configure Health Checks

Add a health check endpoint to your application:

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

Configure Railway health check:
1. Navigate to your project settings
2. Click "Health Check"
3. Set path: `/health`
4. Set interval: 30 seconds
5. Set timeout: 10 seconds

## Security Best Practices

- **Never commit secrets to version control**
- Use Railway's built-in environment variables
- Enable HTTPS (automatic on Railway)
- Use strong JWT secrets
- Enable Railway's built-in DDoS protection
- Regularly rotate secrets
- Use Railway's built-in CI/CD security features

## Cost Optimization

- Use the Starter plan for development
- Monitor resource usage regularly
- Set up budget alerts
- Use auto-scaling to handle traffic spikes
- Delete unused projects
- Consider reserved instances for consistent workloads

## Troubleshooting

### Build Failures

- Check build logs for errors
- Verify `package.json` scripts
- Ensure all dependencies are listed
- Check Node.js version compatibility

### Runtime Errors

- Check application logs
- Verify environment variables
- Test database connections
- Check Redis connectivity

### Deployment Failures

- Verify repository access
- Check branch permissions
- Ensure Railway has GitHub access
- Check for merge conflicts

### Performance Issues

- Monitor resource usage
- Check for memory leaks
- Optimize database queries
- Enable caching
- Consider scaling up

## CI/CD Pipeline

### GitHub Actions Integration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/cli@v1
        with:
          command: deploy
          service-id: ${{ secrets.RAILWAY_SERVICE_ID }}
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

### Manual Deployment

Deploy from command line:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)
- [Railway Pricing](https://railway.app/pricing)
- [Railway GitHub](https://github.com/railwayapp)
