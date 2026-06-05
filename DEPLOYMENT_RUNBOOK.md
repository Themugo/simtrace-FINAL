# SimTrace Deployment Runbook

This runbook provides step-by-step instructions for deploying and managing SimTrace in production.

## Pre-Deployment Checklist

### Environment Variables
- [ ] All required environment variables set in Railway
- [ ] All required environment variables set in Vercel
- [ ] MongoDB Atlas connection string configured
- [ ] Redis connection URL configured
- [ ] JWT_SECRET is secure (32+ random characters)
- [ ] ANTHROPIC_API_KEY is valid
- [ ] Payment gateway credentials configured (Stripe or M-Pesa)
- [ ] Sentry DSN configured for error tracking

### Infrastructure
- [ ] MongoDB Atlas M10+ cluster running
- [ ] Redis instance running
- [ ] Railway project created
- [ ] Vercel project created
- [ ] Custom domains configured (simtrace.site, api.simtrace.site)
- [ ] DNS records updated
- [ ] SSL certificates active

### Security
- [ ] TRACK_REQUIRE_AUTH=true in production
- [ ] ALLOWED_ORIGINS restricted to production domains
- [ ] API keys rotated from development values
- [ ] Demo accounts removed or passwords changed
- [ ] Rate limiting configured appropriately

### Monitoring
- [ ] Sentry project configured
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up
- [ ] Alert thresholds configured
- [ ] Backup strategy in place

## Deployment Process

### 1. Validate Environment
```bash
# Run environment validation
npm run validate-env
```

### 2. Run Tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

### 3. Build Applications
```bash
# Frontend build
npm run build

# Backend build (Docker)
docker build ./backend -t simtrace-backend:latest
```

### 4. Deploy Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up --service simtrace-backend

# Monitor logs
railway logs
```

### 5. Deploy Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 6. Verify Deployment
```bash
# Check backend health
curl https://api.simtrace.site/health

# Check frontend load
curl https://simtrace.site

# Test API endpoints
curl https://api.simtrace.site/api/imei/356938035643809
```

### 7. Seed Production Data (if needed)
```bash
# Set production MONGO_URI in local .env
MONGO_URI="mongodb+srv://..." node backend/scripts/seed-demo.js

# Immediately change demo account passwords
# Or remove seed accounts before going live
```

## Post-Deployment Verification

### Health Checks
- [ ] Backend health endpoint returns 200
- [ ] Frontend loads without errors
- [ ] Database connections successful
- [ ] Redis connection successful
- [ ] Socket.io connections working
- [ ] AI features functional

### Functional Testing
- [ ] User registration works
- [ ] User login works
- [ ] Device registration works
- [ ] IMEI lookup works
- [ ] Device tracking works
- [ ] Alert system works
- [ ] Payment flow works (Stripe or M-Pesa)
- [ ] Email notifications work
- [ ] SMS notifications work (if configured)

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database query performance acceptable
- [ ] No memory leaks detected
- [ ] CPU usage within limits

### Security Testing
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] Authentication working
- [ ] Authorization working
- [ ] SQL injection protection working
- [ ] XSS protection working
- [ ] HTTPS enforced

## Monitoring & Alerting

### Key Metrics to Monitor
- Backend health endpoint status
- Frontend uptime
- Database connection pool status
- Redis connection status
- Error rates (Sentry)
- Response times
- Memory usage
- CPU usage
- Disk usage
- Network traffic

### Alert Thresholds
- Backend health check failure: Immediate alert
- Error rate > 5%: Alert
- Response time > 2s: Alert
- Memory usage > 80%: Alert
- CPU usage > 80%: Alert
- Database connections > 80%: Alert

### Monitoring Tools
- **Sentry**: Error tracking and performance monitoring
- **Railway Logs**: Backend application logs
- **Vercel Analytics**: Frontend performance
- **MongoDB Atlas**: Database metrics
- **UptimeRobot**: External uptime monitoring
- **Logtail** (optional): Centralized log aggregation

## Rollback Procedure

### If Deployment Fails
1. Check logs in Railway/Vercel
2. Identify the failure point
3. Fix the issue locally
4. Test the fix
5. Redeploy

### If Critical Issues After Deployment
1. Immediately rollback to previous version:
   ```bash
   # Railway rollback
   railway rollback

   # Vercel rollback
   vercel rollback
   ```
2. Investigate the issue
3. Fix in development
4. Test thoroughly
5. Redeploy

### Database Rollback
1. MongoDB Atlas has automated backups
2. Restore from snapshot if needed
3. Contact MongoDB support for point-in-time recovery

## Troubleshooting

### Backend Issues

**Health Check Failing**
- Check Railway logs
- Verify environment variables
- Check database connection
- Check Redis connection
- Verify JWT_SECRET is set

**Database Connection Issues**
- Verify MONGO_URI is correct
- Check IP whitelist in Atlas
- Verify database user credentials
- Check cluster status in Atlas

**Redis Connection Issues**
- Verify REDIS_URL is correct
- Check Redis instance status
- Verify security groups allow connections

**High Error Rates**
- Check Sentry for error details
- Review recent deployments
- Check for third-party service outages
- Verify API keys are valid

### Frontend Issues

**Build Failures**
- Check build logs in Vercel
- Verify environment variables
- Check for dependency conflicts
- Run build locally to reproduce

**Runtime Errors**
- Check browser console
- Check Sentry for errors
- Verify API endpoints are accessible
- Check CORS configuration

**Performance Issues**
- Check Vercel Analytics
- Optimize images and assets
- Implement caching
- Check for memory leaks

### Payment Issues

**Stripe Webhook Failures**
- Verify STRIPE_WEBHOOK_SECRET
- Check webhook endpoint is accessible
- Verify Stripe signature validation
- Check Stripe dashboard for webhook status

**M-Pesa Callback Failures**
- Verify callback URL is correct
- Check IP whitelist
- Verify MPESA credentials
- Check Safaricom Daraja status

## Maintenance Tasks

### Daily
- Review error rates in Sentry
- Check uptime monitoring
- Review system metrics

### Weekly
- Review and rotate logs
- Check backup status
- Review performance metrics
- Security audit logs

### Monthly
- Update dependencies
- Review and update documentation
- Security audit
- Performance review
- Cost review

### Quarterly
- Disaster recovery test
- Security penetration test
- Performance optimization review
- Architecture review

## Emergency Contacts

| Service | Contact | Priority |
|---------|---------|----------|
| MongoDB Atlas | support.mongodb.com | High |
| Railway | help.railway.app | High |
| Vercel | support.vercel.com | High |
| Stripe | support.stripe.com | Medium |
| Safaricom Daraja | developers@safaricom.co.ke | High |
| Sentry | support.sentry.io | Medium |
| SendGrid | support.sendgrid.com | Low |

## Incident Response

### Severity Levels

**P0 - Critical**
- System completely down
- Data loss
- Security breach
- Payment processing failure

**P1 - High**
- Major functionality broken
- Performance severely degraded
- Data integrity issues

**P2 - Medium**
- Minor functionality broken
- Performance degraded
- Non-critical bugs

**P3 - Low**
- Cosmetic issues
- Documentation errors
- Enhancement requests

### Response Times

- **P0**: 15 minutes
- **P1**: 1 hour
- **P2**: 4 hours
- **P3**: 24 hours

### Incident Response Process

1. **Detect**: Monitoring alerts trigger
2. **Assess**: Determine severity and impact
3. **Respond**: Execute appropriate response plan
4. **Resolve**: Fix the issue
5. **Communicate**: Notify stakeholders
6. **Review**: Post-incident analysis
7. **Improve**: Update processes to prevent recurrence

## Backup & Recovery

### Database Backups
- MongoDB Atlas automated backups (daily)
- Point-in-time recovery (up to 7 days)
- Manual snapshots before major changes

### Recovery Procedures
1. Identify the recovery point
2. Select appropriate backup/snapshot
3. Restore to staging environment first
4. Verify data integrity
5. Restore to production if verified
6. Test critical functionality

### Disaster Recovery
- Multi-region deployment (future)
- Database failover (future)
- CDN for static assets (future)
- Load balancing (future)

## Security Best Practices

### Regular Security Tasks
- Rotate API keys quarterly
- Review access logs monthly
- Update dependencies monthly
- Security audit quarterly
- Penetration testing annually

### Incident Response
- Security breach: Immediate response
- Data leak: Immediate response
- Unauthorized access: Immediate response
- DDoS attack: Immediate mitigation

## Compliance

### Data Protection
- GDPR compliance (if EU users)
- Data retention policies
- Data deletion procedures
- Privacy policy maintained

### Financial Compliance
- PCI DSS compliance (Stripe)
- M-Pesa compliance requirements
- Financial data encryption
- Audit trail maintained

## Documentation

### Required Documentation
- Architecture diagrams
- API documentation
- Deployment procedures
- Runbooks (this document)
- Troubleshooting guides
- Incident reports

### Documentation Updates
- Update after each deployment
- Update after incident resolution
- Review quarterly
- Maintain version control
