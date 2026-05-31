# Sentry Monitoring Setup Guide

This guide walks through setting up Sentry error monitoring and performance tracking for SimTrace.

## Prerequisites

- Sentry account (sign up at https://sentry.io)
- Backend deployed to Railway
- Frontend deployed to Vercel

## Step 1: Create a Sentry Account

1. Go to https://sentry.io
2. Click "Start Free" or "Sign Up"
3. Sign up with GitHub, Google, or email
4. Complete the registration process
5. Verify your email address

## Step 2: Create a New Project

1. After logging in, click "Create Project"
2. Choose your platform:
   - **Node.js** for backend
   - **Next.js** for frontend
3. Name your project (e.g., "simtrace-backend" or "simtrace-frontend")
4. Set the alert frequency
5. Click "Create Project"

## Step 3: Get DSN (Data Source Name)

Sentry will provide a DSN for your project:

```
https://<key>@<project>.ingest.sentry.io/<project-id>
```

Copy this DSN - you'll need it for configuration.

## Step 4: Configure Backend Monitoring

### Install Sentry SDK

```bash
cd backend
npm install @sentry/node @sentry/tracing
```

### Configure Sentry

Create or update `backend/sentry.ts`:

```typescript
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions
  // Set sampling rate for profiling
  profilesSampleRate: 1.0,
  // Environment
  environment: process.env.NODE_ENV || "development",
  // Release
  release: process.env.RELEASE_VERSION || "1.0.0",
  // Before Send Hook (filter errors)
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore specific error types
        if (error.message.includes("Ignore this error")) {
          return null;
        }
      }
    }
    return event;
  },
});

export default Sentry;
```

### Add to Application

Import Sentry in your main entry point (`backend/server.ts`):

```typescript
import "./sentry.js";
```

### Add Environment Variable

Add to Railway environment variables:

```bash
SENTRY_DSN=https://<key>@<project>.ingest.sentry.io/<project-id>
SENTRY_ENVIRONMENT=production
RELEASE_VERSION=1.0.0
```

## Step 5: Configure Frontend Monitoring

### Install Sentry SDK

```bash
npm install @sentry/nextjs
```

### Initialize Sentry

Run the initialization wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

This will:
- Create `sentry.client.config.ts`
- Create `sentry.server.config.ts`
- Create `sentry.edge.config.ts`
- Update `next.config.js`
- Add `.sentryclirc` file

### Manual Configuration

If you prefer manual configuration, create the following files:

**`sentry.client.config.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

**`sentry.server.config.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**`sentry.edge.config.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Add Environment Variables

Add to Vercel environment variables:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://<key>@<project>.ingest.sentry.io/<project-id>
SENTRY_AUTH_TOKEN=<your-auth-token>
```

## Step 6: Configure Performance Monitoring

### Backend Performance

Add performance monitoring to your routes:

```typescript
import * as Sentry from "@sentry/node";

app.get("/api/devices", async (req, res, next) => {
  const transaction = Sentry.startTransaction({
    op: "http.server",
    name: "GET /api/devices",
  });

  try {
    // Your route logic
    const devices = await Device.find({});
    res.json(devices);
  } catch (error) {
    Sentry.captureException(error);
    next(error);
  } finally {
    transaction.finish();
  }
});
```

### Frontend Performance

Sentry automatically captures:
- Page views
- Core Web Vitals
- User interactions
- Network requests

Custom transactions:

```typescript
import * as Sentry from "@sentry/nextjs";

const transaction = Sentry.startTransaction({
  name: "custom-operation",
  op: "task",
});

try {
  // Your operation
  await performTask();
} catch (error) {
  Sentry.captureException(error);
} finally {
  transaction.finish();
}
```

## Step 7: Configure Error Reporting

### Manual Error Reporting

**Backend:**
```typescript
import * as Sentry from "@sentry/node";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
  // Also log to console
  console.error(error);
}
```

**Frontend:**
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
}
```

### Custom Error Messages

```typescript
Sentry.captureMessage("Something went wrong", "warning");
```

### Add Context

```typescript
Sentry.withScope((scope) => {
  scope.setUser({ id: user.id, email: user.email });
  scope.setTag("page", "dashboard");
  scope.setExtra("device_info", deviceInfo);
  Sentry.captureException(error);
});
```

## Step 8: Configure Alerts

### Create Alert Rules

1. Navigate to your project in Sentry
2. Click "Settings" → "Alerts"
3. Click "New Alert Rule"
4. Configure:
   - **Alert Type**: Error count, crash rate, performance
   - **Conditions**: Threshold, time window
   - **Actions**: Email, Slack, PagerDuty
5. Click "Save Rule"

### Recommended Alerts

- **Error Count**: Alert when errors > 10 in 5 minutes
- **Crash Rate**: Alert when crash rate > 1%
- **Performance**: Alert when p95 latency > 1s
- **Transaction Failure**: Alert when failure rate > 5%

## Step 9: Configure Release Tracking

### Backend Releases

Tag your deployments:

```bash
# Before deployment
sentry-cli releases new -p simtrace-backend -r $(git rev-parse HEAD)

# After deployment
sentry-cli releases finalize -p simtrace-backend $(git rev-parse HEAD)
```

### Frontend Releases

Vercel automatically creates releases. Configure in `.sentryclirc`:

```ini
[auth]
token=<your-auth-token>

[defaults]
org=your-org
project=simtrace-frontend

[deploy]
url_prefix=/
```

## Step 10: Configure User Feedback

### User Feedback Widget

Add to your frontend:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    new Sentry.Feedback({
      triggerLabel: "Report an issue",
      formTitle: "How can we improve?",
      submitButtonLabel: "Send feedback",
      messagePlaceholder: "What's the issue?",
      successMessage: "Thank you for your feedback!",
    }),
  ],
});
```

### Error Boundary

Add to your Next.js app:

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## Step 11: Configure Session Replay

### Enable Session Replay

Sentry Replay captures video-like reproductions of user sessions.

**Frontend:**
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

## Step 12: Configure Source Maps

### Backend Source Maps

Generate source maps in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

Upload source maps:

```bash
sentry-cli releases files <release-version> upload-sourcemaps --url-prefix ~/backend/dist
```

### Frontend Source Maps

Vercel automatically uploads source maps. Configure in `next.config.js`:

```javascript
const nextConfig = {
  sentry: {
    hideSourceMaps: false,
    widenClientFileUpload: true,
  },
};

module.exports = nextConfig;
```

## Step 13: Configure Integrations

### Slack Integration

1. Navigate to Sentry → Settings → Integrations
2. Enable Slack
3. Configure webhook URL
4. Set up alert routing

### PagerDuty Integration

1. Navigate to Sentry → Settings → Integrations
2. Enable PagerDuty
3. Configure API key
4. Set up alert routing

### GitHub Integration

1. Navigate to Sentry → Settings → Integrations
2. Enable GitHub
3. Configure repository
4. Link issues to commits

## Step 14: Monitor and Analyze

### Dashboard

1. Navigate to your project in Sentry
2. View:
   - Error overview
   - Performance metrics
   - User sessions
   - Release health

### Issues

1. Click "Issues" tab
2. Filter by:
   - Severity
   - Environment
   - Release
   - User
3. Investigate and resolve issues

### Performance

1. Click "Performance" tab
2. View:
   - Transaction duration
   - Database queries
   - External requests
   - Core Web Vitals

## Security Best Practices

- **Never commit DSN to version control**
- Use environment variables for secrets
- Enable PII (Personally Identifiable Information) masking
- Use source maps only in production
- Regularly rotate auth tokens
- Enable IP filtering
- Use Sentry's built-in security features

## Cost Optimization

- Use the Developer plan for development (free)
- Monitor usage regularly
- Set up budget alerts
- Adjust sampling rates:
  - Reduce tracesSampleRate to 0.1 for high-traffic apps
  - Reduce replaysSessionSampleRate to 0.05
- Use source maps only for production
- Delete unused projects

## Troubleshooting

### Errors Not Appearing

- Verify DSN is correct
- Check network connectivity
- Verify environment variables
- Check Sentry initialization
- Review beforeSend hooks

### Performance Data Missing

- Verify tracesSampleRate > 0
- Check performance integrations
- Verify transaction naming
- Review sampling configuration

### Source Maps Not Working

- Verify source maps are generated
- Check upload process
- Verify URL prefix
- Check file paths

### High Costs

- Reduce sampling rates
- Disable unnecessary features
- Review retention policies
- Delete old data
- Use filtering

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Pricing](https://sentry.io/pricing/)
