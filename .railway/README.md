# Railway Deployment Guide

## Overview

This directory contains configuration files for deploying the Say Mat-go WebSocket server on Railway.

## Quick Start

1. **Create Railway Account**: Sign up at https://railway.app/

2. **Create New Project**:
   ```bash
   railway login
   railway init
   ```

3. **Set Environment Variables**:
   - Copy `.railway/env.example` to reference
   - Set variables in Railway dashboard under "Variables"
   - Required: `SUPABASE_JWKS_URL`, `SUPABASE_PROJECT_ID`, `REDIS_URL`

4. **Deploy**:
   ```bash
   railway up
   ```

## Configuration Files

- **Dockerfile**: Container build instructions
- **railway.toml**: Deployment settings
- **env.example**: Environment variable template

## Environment Variables

See `env.example` for complete list of required and optional variables.

## Monitoring

- View logs: `railway logs`
- View metrics: Railway dashboard
- Status checks: `/health` endpoint (TASK-002)

## Scaling

Railway automatically scales based on load. Redis Pub/Sub enables state synchronization across instances.

## Troubleshooting

**Connection Issues**: Check `REDIS_URL` and ensure Redis is accessible
**Authentication Failures**: Verify `SUPABASE_JWKS_URL` is correct
**Build Errors**: Ensure `npm ci` succeeds locally first
