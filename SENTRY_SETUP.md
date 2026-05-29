# Sentry Monitoring Setup

Sentry is configured for both backend and frontend error tracking and performance monitoring.

## Backend Setup

### Configuration
- Backend uses `@sentry/node` package
- Configuration in `backend/sentry.js`
- Imported in `backend/server.js`

### Required Environment Variables
Add these to your backend environment (Render, local .env):
```
SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
```

### Installation
```bash
cd backend
npm install @sentry/node
```

## Frontend Setup

### Configuration
- Frontend uses `@sentry/nextjs` package
- Configuration in `next.config.js`
- Already included in dependencies

### Required Environment Variables
Add these to your frontend environment (Vercel, local .env):
```
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
```

## Getting Sentry Credentials

1. Go to https://sentry.io
2. Sign up for free tier
3. Create a new project:
   - For backend: Select "Node.js"
   - For frontend: Select "Next.js"
4. Get your DSN from project settings
5. Note your organization name and project name

## Testing Sentry Integration

### Backend Test
```bash
cd backend
node -e "import('./sentry.js'); throw new Error('Test Sentry error');"
```

### Frontend Test
Add this to a component to test:
```javascript
throw new Error('Test Sentry error');
```

## Monitoring Features

- **Error Tracking**: Automatic error capture and reporting
- **Performance Monitoring**: Track API response times and database queries
- **Release Tracking**: Track errors by deployment version
- **User Context**: Track which users experience errors
- **Breadcrumbs**: Track user actions leading to errors

## Production Configuration

In production, Sentry is configured with:
- 10% transaction sampling rate (performance)
- 10% profile sampling rate (profiling)
- Environment-aware error grouping

In development, higher sampling rates are used for better debugging.
