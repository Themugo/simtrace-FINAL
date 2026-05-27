# Monorepo Restructure Plan

This document outlines the proposed Turborepo monorepo structure for the SimTrace platform.

## Proposed Structure

```
simtrace-FINAL-main/
├── apps/
│   ├── web/                 # Next.js frontend application
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── src/
│   │   └── public/
│   ├── api/                 # Backend API (Node.js/Express)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── modules/
│   │   │   ├── analytics/
│   │   │   ├── ml/
│   │   │   ├── security/
│   │   │   ├── blacklist/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── workers/             # Background workers
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── ai-worker.ts
│   │   │   ├── export-worker.ts
│   │   │   ├── telemetry-worker.ts
│   │   │   └── email-worker.ts
│   │   └── index.ts
│   ├── admin/               # Admin dashboard
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── src/
│   └── docs/                # Documentation site
│       ├── package.json
│       ├── tsconfig.json
│       └── docs/
├── packages/
│   ├── ui/                  # Shared UI components
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── index.ts
│   ├── types/               # Shared TypeScript types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── user.ts
│   │       ├── device.ts
│   │       ├── risk-score.ts
│   │       ├── tracking-event.ts
│   │       ├── organization.ts
│   │       ├── case.ts
│   │       └── index.ts
│   ├── utils/               # Shared utility functions
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── date.ts
│   │       ├── validation.ts
│   │       ├── formatting.ts
│   │       └── index.ts
│   ├── config/              # Shared configuration
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── database.ts
│   │       ├── redis.ts
│   │       ├── kafka.ts
│   │       └── index.ts
│   └── sdk/                 # JavaScript SDK for partners
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── client.ts
│           ├── types.ts
│           └── index.ts
├── turbo.json               # Turborepo configuration
├── package.json             # Root workspace package.json
├── tsconfig.json            # Root TypeScript config
└── .gitignore
```

## Root package.json

```json
{
  "name": "simtrace-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.7.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

## turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

## Migration Steps

1. **Create directory structure**
   ```bash
   mkdir -p apps/{web,api,workers,admin,docs}
   mkdir -p packages/{ui,types,utils,config,sdk}
   ```

2. **Move frontend to apps/web**
   ```bash
   mv src apps/web/
   mv public apps/web/
   mv next.config.js apps/web/
   mv package.json apps/web/
   ```

3. **Move backend to apps/api**
   ```bash
   mv backend apps/api/src
   ```

4. **Create shared packages**
   - Extract common types to packages/types
   - Extract UI components to packages/ui
   - Extract utilities to packages/utils
   - Create config package for shared configuration
   - Create SDK package for partner integration

5. **Update package.json files**
   - Add workspace references
   - Configure internal dependencies
   - Set up build scripts

6. **Configure TypeScript**
   - Create root tsconfig.json with composite settings
   - Configure project references

7. **Update imports**
   - Update all imports to use package names
   - Example: `import { User } from '@simtrace/types'`

## Benefits

1. **Shared Code**: Reuse types, utilities, and components across apps
2. **Consistent Builds**: Turborepo handles build orchestration and caching
3. **Type Safety**: Project references ensure type consistency
4. **Independent Deployment**: Each app can be deployed independently
5. **Better Organization**: Clear separation of concerns
6. **Faster Development**: Turborepo's caching speeds up builds

## Package Naming Convention

- `@simtrace/ui` - Shared UI components
- `@simtrace/types` - Shared TypeScript types
- `@simtrace/utils` - Shared utilities
- `@simtrace/config` - Shared configuration
- `@simtrace/sdk` - Partner SDK

## Internal Dependencies

Apps depend on packages:

```
apps/web → @simtrace/ui, @simtrace/types, @simtrace/utils
apps/api → @simtrace/types, @simtrace/utils, @simtrace/config
apps/workers → @simtrace/types, @simtrace/utils, @simtrace/config
apps/admin → @simtrace/ui, @simtrace/types, @simtrace/utils
apps/docs → @simtrace/types
```

## Build Order

Turborepo automatically determines build order based on dependencies:

1. packages/types
2. packages/utils
3. packages/config
4. packages/ui
5. packages/sdk
6. apps/api
7. apps/workers
8. apps/web
9. apps/admin
10. apps/docs

## Development Workflow

```bash
# Install dependencies
npm install

# Run all apps in development
npm run dev

# Build all apps
npm run build

# Run tests
npm run test

# Type check all packages
npm run type-check

# Lint all packages
npm run lint

# Clean all build artifacts
npm run clean
```

## Environment Variables

Each app can have its own `.env.local` file:

```
apps/web/.env.local
apps/api/.env.local
apps/workers/.env.local
```

Shared environment variables can be in the root:

```
.env.local
.env.production
```

## Deployment

Each app can be deployed independently:

```bash
# Build and deploy web app
cd apps/web
npm run build
# Deploy to Vercel/Netlify

# Build and deploy API
cd apps/api
npm run build
# Deploy to serverless/container

# Build and deploy workers
cd apps/workers
npm run build
# Deploy to worker platform
```

## Notes

- This is a proposed structure for future migration
- Current codebase remains functional as-is
- Migration should be done incrementally
- Test thoroughly after each migration step
- Consider using Nx as an alternative to Turborepo
