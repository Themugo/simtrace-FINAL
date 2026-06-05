# Vercel Deployment Guide

This guide walks through deploying the SimTrace frontend to Vercel.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- Git repository with the SimTrace frontend code
- Backend API URL (from Railway deployment)

## Step 1: Create a Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub, GitLab, Bitbucket, or email
4. Complete the registration process
5. Verify your email address

## Step 2: Create a New Project

1. After logging in, click "Add New" → "Project"
2. Choose one of the following:
   - **Import Git Repository** (recommended)
   - **Continue from Template**
3. If importing from Git:
   - Authorize Vercel to access your repositories
   - Select the `simtrace-FINAL` repository
   - Select the branch to deploy (usually `main`)
4. Click "Import"

## Step 3: Configure Build Settings

Vercel will automatically detect the Next.js project. Verify the build settings:

### Framework Preset
```
Next.js
```

### Root Directory
```
. (root of repository)
```

### Build Command
```bash
npm run build
```

### Output Directory
```
.next
```

### Install Command
```bash
npm install
```

## Step 4: Configure Environment Variables

Navigate to your project settings and add the following environment variables:

### API Configuration
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Optional Variables
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=<your-mapbox-token>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in these variables.

## Step 5: Deploy the Application

1. Click "Deploy"
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Build the application
   - Deploy to edge network
3. Monitor the deployment logs for any errors

## Step 6: Verify Deployment

1. Vercel will provide a preview URL
2. Test the application:
   - Navigate to the preview URL
   - Check if the application loads
   - Test API calls
   - Verify authentication flow
3. If successful, click "Promote to Production"

## Step 7: Configure Custom Domain

### Add Custom Domain

1. Navigate to your project settings
2. Click "Domains"
3. Click "Add Domain"
4. Enter your custom domain (e.g., `app.simtrace.com`)
5. Click "Add"

### Configure DNS

Vercel will provide DNS records to add:

**For root domain (simtrace.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain (app.simtrace.com):**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### Verify DNS

1. Add the DNS records to your domain registrar
2. Wait for DNS propagation (usually 5-30 minutes)
3. Vercel will automatically detect and configure SSL

## Step 8: Configure Branch Previews

1. Navigate to your project settings
2. Click "Git"
3. Enable "Branch Previews"
4. Configure:
   - **Preview Branches**: `*` (all branches) or specific branches
   - **Preview Deployment Comment**: Enable
   - **Automatic Preview Comments**: Enable

## Step 9: Configure Production Branch

1. Navigate to your project settings
2. Click "Git"
3. Set "Production Branch" to `main`
4. Configure deployment behavior:
   - **Automatic Deployments**: Enable
   - **Deploy Hooks**: Configure if needed

## Step 10: Enable Analytics

1. Navigate to your project settings
2. Click "Analytics"
3. Enable Vercel Analytics
4. Add the analytics script to your app:

```typescript
// app/layout.tsx or pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <head />
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Step 11: Configure Edge Functions

For API routes that need to run at the edge:

```typescript
// app/api/example/route.ts
export const config = {
  runtime: 'edge',
};

export async function GET(request: Request) {
  return new Response('Hello from Edge!');
}
```

## Step 12: Set Up Redirects

Configure redirects in `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    },
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.railway.app/api/:path*",
      "permanent": false
    }
  ]
}
```

## Step 13: Configure Rewrites

Configure rewrites in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.railway.app/api/:path*"
    }
  ]
}
```

## Step 14: Enable Security Headers

Configure security headers in `next.config.js`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

## Step 15: Configure Caching

### Static Asset Caching

Configure caching in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/static/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Image Optimization

Vercel automatically optimizes images. Configure in `next.config.js`:

```javascript
const nextConfig = {
  images: {
    domains: ['your-domain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-domain.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

## Step 16: Set Up Monitoring

### Vercel Analytics

1. Navigate to your project
2. Click "Analytics" tab
3. View:
  - Page views
  - Web Vitals
  - Core Web Vitals
  - User demographics

### Logs

1. Navigate to your project
2. Click "Logs" tab
3. View real-time logs
4. Filter by:
  - Deployment
  - Edge Function
  - Serverless Function

### Alerts

1. Navigate to your project settings
2. Click "Notifications"
3. Configure alerts for:
  - Deployment failures
  - Error rate increases
  - Performance degradation

## Security Best Practices

- **Never commit secrets to version control**
- Use Vercel's built-in environment variables
- Enable HTTPS (automatic on Vercel)
- Use Vercel's built-in DDoS protection
- Enable security headers
- Regularly rotate secrets
- Use Vercel's built-in CI/CD security features
- Enable Vercel's built-in rate limiting

## Cost Optimization

- Use the Hobby plan for development (free)
- Monitor usage regularly
- Set up budget alerts
- Use image optimization
- Enable static caching
- Use edge functions for simple API routes
- Consider the Pro plan for production ($20/month)

## Troubleshooting

### Build Failures

- Check build logs for errors
- Verify `package.json` scripts
- Ensure all dependencies are listed
- Check Node.js version compatibility
- Verify environment variables

### Runtime Errors

- Check application logs
- Verify environment variables
- Test API connectivity
- Check for CORS issues
- Verify authentication flow

### Deployment Failures

- Verify repository access
- Check branch permissions
- Ensure Vercel has Git access
- Check for merge conflicts

### Performance Issues

- Monitor Core Web Vitals
- Optimize images
- Enable static caching
- Use edge functions
- Implement lazy loading
- Optimize bundle size

## CI/CD Pipeline

### GitHub Actions Integration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Manual Deployment

Deploy from command line:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Pricing](https://vercel.com/pricing)
- [Next.js on Vercel](https://vercel.com/frameworks/nextjs)
