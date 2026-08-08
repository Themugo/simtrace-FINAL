# Production Setup Guide

This guide provides step-by-step instructions for setting up the production infrastructure for SimTrace.

## Table of Contents

1. [MongoDB Atlas Setup](./MONGODB_ATLAS_SETUP.md)
2. [Redis Setup](./REDIS_SETUP.md)
3. [Railway Deployment](./RAILWAY_DEPLOYMENT.md)
4. [Vercel Deployment](./VERCEL_DEPLOYMENT.md)
5. [Sentry Monitoring](./SENTRY_SETUP.md)

## Prerequisites

- Node.js 18+ installed
- Git installed
- MongoDB Atlas account (free tier available)
- Redis account (Redis Cloud or Upstash recommended)
- Railway account (for backend deployment)
- Vercel account (for frontend deployment)
- Sentry account (for error monitoring)

## Environment Variables

All services require environment variables to be configured. See individual service guides for specific variable requirements.

## Quick Start

1. Set up MongoDB Atlas (see [MongoDB Atlas Setup](./MONGODB_ATLAS_SETUP.md))
2. Set up Redis (see [Redis Setup](./REDIS_SETUP.md))
3. Deploy backend to Railway (see [Railway Deployment](./RAILWAY_DEPLOYMENT.md))
4. Deploy frontend to Vercel (see [Vercel Deployment](./VERCEL_DEPLOYMENT.md))
5. Configure Sentry monitoring (see [Sentry Setup](./SENTRY_SETUP.md))

## Support

For issues or questions, refer to the individual service guides or contact the development team.
