# MongoDB Atlas Setup Guide

This guide walks through setting up a MongoDB Atlas production cluster for SimTrace.

## Prerequisites

- MongoDB Atlas account (sign up at https://www.mongodb.com/cloud/atlas)
- Basic understanding of MongoDB

## Step 1: Create a MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" or "Sign In"
3. Complete the registration process
4. Verify your email address

## Step 2: Create a New Cluster

1. After logging in, click "Build a Database"
2. Choose a cloud provider (AWS, GCP, or Azure)
3. Select a region closest to your users
4. Choose cluster tier:
   - **Free Tier (M0)**: Good for development/testing
   - **M10+**: Recommended for production (starts at ~$57/month)
5. Name your cluster (e.g., "simtrace-production")
6. Click "Create Cluster"

## Step 3: Configure Cluster Settings

### Security Settings

1. Navigate to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose authentication method:
   - **Password Authentication** (recommended for simplicity)
   - **SCRAM-SHA-256** (more secure)
4. Enter username and strong password
5. Select privileges:
   - Read and write to any database
   - Or restrict to specific databases
6. Click "Add User"

### Network Access

1. Navigate to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose one of the following:
   - **Allow Access from Anywhere** (0.0.0.0/0) - Not recommended for production
   - **Allow Access from Your IP** - Recommended for development
   - **Allow Access from Specific IP Ranges** - Recommended for production
4. For Railway deployment, you'll need to whitelist Railway's IP ranges
5. Click "Confirm"

## Step 4: Get Connection String

1. Navigate to your cluster
2. Click "Connect"
3. Choose "Connect your application"
4. Select your Node.js version
5. Copy the connection string

The connection string will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Step 5: Configure Environment Variables

Add the following to your `.env` file or Railway environment variables:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/simtrace?retryWrites=true&w=majority
```

Replace:
- `<username>` with your MongoDB username
- `<password>` with your MongoDB password
- `cluster0.xxxxx` with your cluster name
- `simtrace` with your database name (optional)

## Step 6: Test Connection

Run the following command to test your connection:

```bash
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(console.error);"
```

Or use the MongoDB Atlas "Connect" → "Connect with MongoDB Shell" option.

## Step 7: Enable Backup (Production Only)

For production clusters (M10+), enable automatic backups:

1. Navigate to your cluster
2. Click "Backup" tab
3. Enable "Continuous Backup" or "Scheduled Backup"
4. Configure retention policy (recommended: 30+ days)
5. Enable point-in-time recovery if needed

## Step 8: Configure Indexes

MongoDB Atlas will automatically create indexes based on your application schema. For optimal performance, consider creating additional indexes:

```javascript
// Example: Create compound index for device queries
db.devices.createIndex({ imei: 1, status: 1 })

// Example: Create index for ping queries
db.pings.createIndex({ imei: 1, ts: -1 })
```

## Step 9: Monitor Performance

1. Navigate to "Metrics" tab in Atlas
2. Monitor:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network throughput
   - Operation counts
3. Set up alerts for:
   - High CPU (>80%)
   - High memory (>80%)
   - Slow queries (>100ms)

## Step 10: Scale as Needed

If your cluster needs more resources:

1. Navigate to your cluster
2. Click "Modify"
3. Upgrade to a higher tier
4. Or add additional shards for horizontal scaling

## Security Best Practices

- **Never commit credentials to version control**
- Use strong passwords (16+ characters, mixed case, numbers, symbols)
- Enable IP whitelisting for production
- Use TLS/SSL connections (enabled by default in Atlas)
- Regularly rotate passwords
- Enable MongoDB Atlas security features:
  - Data encryption at rest
  - Network encryption
  - Auditing
  - Real-time monitoring

## Cost Optimization

- Use M0 free tier for development
- Monitor usage regularly
- Set up budget alerts
- Consider serverless instances for variable workloads
- Delete unused clusters

## Troubleshooting

### Connection Timeout

- Check IP whitelist settings
- Verify network connectivity
- Check firewall rules
- Ensure TLS is enabled

### Authentication Failed

- Verify username and password
- Check user permissions
- Ensure correct database name in connection string

### Performance Issues

- Check query performance using Profiler
- Add appropriate indexes
- Consider scaling cluster
- Review slow query logs

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Connection String Options](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Security Best Practices](https://docs.mongodb.com/manual/administration/security-checklist/)
