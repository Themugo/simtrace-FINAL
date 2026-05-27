# @simtrace/types

Shared TypeScript types for the SimTrace platform.

This package contains type definitions used across:
- Frontend (Next.js/React)
- Backend (Express/Node.js)
- SDKs (JavaScript, Mobile)
- Worker processes

## Installation

```bash
npm install @simtrace/types
```

## Usage

```typescript
import { User, Device, RiskAssessment } from '@simtrace/types';

const user: User = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  createdAt: new Date(),
};
```

## Available Types

### Core Types
- `User` - User account information
- `Device` - Device tracking information
- `RiskAssessment` - Risk scoring results
- `TrackingEvent` - Device tracking events
- `DeviceLocation` - Geolocation data
- `DeviceSession` - Device session tracking

### Organization Types
- `Organization` - Organization/workspace information
- `OrganizationMember` - Organization membership
- `Team` - Team within organization

### Case Types
- `Case` - Investigation case
- `CaseNote` - Case notes
- `CaseEvidence` - Evidence attached to cases

### API Types
- `ApiResponse` - Standard API response wrapper
- `PaginatedResponse` - Paginated data response

### Auth Types
- `AuthTokens` - Access and refresh tokens
- `SessionInfo` - Session information

### Billing Types
- `Subscription` - User subscription
- `Plan` - Subscription plan
- `Payment` - Payment records

## Development

```bash
# Type check
npm run type-check

# Build
npm run build
```
