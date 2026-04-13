# SalePilot Deployment Guide

This document matches the current repository layout:

- frontend SPA: [`frontend`](/C:/Users/EricWeston/Desktop/SalePilot/frontend)
- backend API: [`backend`](/C:/Users/EricWeston/Desktop/SalePilot/backend)
- database: MongoDB or MongoDB Atlas

## Recommended Topology

Recommended production setup:

1. Build the frontend into static files.
2. Run the backend as a long-lived Node.js process.
3. Put both behind one HTTPS reverse proxy domain.
4. Proxy `/api/*` to the backend and serve the SPA from `/`.

This same-origin setup is the simplest because:

- the frontend can keep `VITE_API_BASE_URL=/api`
- SSE endpoints work without cross-origin browser issues
- login, refresh-token, and report streaming traffic all stay on one origin

## Runtime Requirements

- Node.js `20.x` or newer
- npm `10.x` or newer
- MongoDB `7.x` or MongoDB Atlas
- one AI provider key if you want AI analysis and AI report generation

## Environment Files

Example files added to the repo:

- backend example: [backend/.env.example](/C:/Users/EricWeston/Desktop/SalePilot/backend/.env.example)
- frontend example: [frontend/.env.example](/C:/Users/EricWeston/Desktop/SalePilot/frontend/.env.example)

Do not commit real `.env` values.

## Backend Deployment

### 1. Install Dependencies

```bash
cd backend
npm install --omit=dev
```

### 2. Create the Backend Env File

```bash
cp .env.example .env
```

Required values before first start:

- `NODE_ENV=production`
- `PORT`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Recommended optional values:

- `AI_PROVIDER` plus its matching API key
- `ERROR_LOG_FILE` if you want logs outside the repo directory
- `ENABLE_CHURN_WARNING_TASK` if you want to disable the daily 9:00 retention job
- `CORS_ALLOWED_ORIGINS` and the `SECURITY_*` / `HSTS_*` headers if you want to tune browser security policy
- rate-limit variables if your gateway traffic profile needs tuning

### 3. Start the API

```bash
cd backend
node index.js
```

For production, run it under a process manager such as `pm2`, `systemd`, Docker, or your hosting platform supervisor.

Example with PM2:

```bash
cd backend
pm2 start index.js --name salepilot-backend
pm2 save
```

### 4. Post-Deploy Checks

Verify:

- `GET /api/test`
- `GET /api/docs`
- login works
- token refresh works
- SSE report generation works

The repo now includes a production smoke test runner at [production-smoke-test.js](/C:/Users/EricWeston/Desktop/SalePilot/backend/scripts/production-smoke-test.js). It validates:

- frontend home page and default SEO meta tags
- SPA deep-link rewrite handling for `/reports/daily`
- static asset delivery
- backend `/api/test`
- backend `/api/docs/openapi.json`
- backend security headers
- optional login, refresh-token, and `/api/auth/me` flow if you provide test credentials

Run it after deployment:

```bash
cd backend
SMOKE_FRONTEND_URL=https://app.example.com \
SMOKE_BACKEND_URL=https://api.example.com \
npm run smoke:production
```

Optional authenticated smoke check:

```bash
cd backend
SMOKE_FRONTEND_URL=https://app.example.com \
SMOKE_BACKEND_URL=https://api.example.com \
SMOKE_USERNAME=tenant-admin \
SMOKE_PASSWORD='Secret123!' \
npm run smoke:production
```

If this is a fresh database or you added new indexes, run:

```bash
cd backend
npm run sync-indexes
```

## Frontend Deployment

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create the Frontend Env File

```bash
cp .env.example .env.production
```

Use one of these values:

- same-origin reverse proxy: `VITE_API_BASE_URL=/api`
- split-domain deployment: `VITE_API_BASE_URL=https://api.example.com/api`
- public frontend origin for SEO/canonical tags: `VITE_SITE_URL=https://app.example.com`

The frontend request layer now reads `VITE_API_BASE_URL` and falls back to `/api`, so production no longer depends on a hardcoded localhost URL. The implementation is in [request.ts](/C:/Users/EricWeston/Desktop/SalePilot/frontend/src/utils/request.ts).

Production build settings are now configurable through [vite.config.ts](/C:/Users/EricWeston/Desktop/SalePilot/frontend/vite.config.ts). Common knobs:

- `VITE_APP_BASE=/`
- `VITE_SITE_URL=https://app.example.com`
- `VITE_BUILD_TARGET=es2020`
- `VITE_BUILD_SOURCEMAP=false`
- `VITE_BUILD_MINIFY=esbuild`
- `VITE_DROP_DEBUGGER=true`
- `VITE_DROP_CONSOLE=false`
- `VITE_BUILD_OUT_DIR=dist`
- `VITE_BUILD_ASSETS_DIR=assets`

The production config also disables the Vue DevTools plugin during build and splits large vendor chunks for `vue`, `element-plus`, and `echarts`.

### 3. Build the SPA

```bash
cd frontend
npm run build
```

Deploy the generated static files from:

- [frontend/dist](/C:/Users/EricWeston/Desktop/SalePilot/frontend/dist)

Any static hosting is fine as long as it can either:

- proxy `/api` to the backend, or
- call the backend via the absolute `VITE_API_BASE_URL`

## Nginx Reverse Proxy Example

This is the recommended same-origin pattern.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /srv/salepilot/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }
}
```

Notes:

- `proxy_buffering off` matters for SSE endpoints such as daily report generation.
- Keep HTTPS termination at the proxy or load balancer.
- If you use a CDN, do not cache `/api/*`.

## Deployment Checklist

Before go-live:

1. Set strong random `JWT_SECRET` and `JWT_REFRESH_SECRET`.
2. Point `MONGODB_URI` at the production database.
3. Set one valid AI provider key.
4. Build the frontend with the correct `VITE_API_BASE_URL`.
5. Confirm `/api/test`, login, token refresh, report SSE, and customer CRUD all work.
6. Confirm backend logs are writable.
7. Run `npm run sync-indexes` once against production MongoDB after schema/index updates.
8. Run `npm run smoke:production` from [backend](/C:/Users/EricWeston/Desktop/SalePilot/backend) against the deployed frontend/backend URLs.

## Troubleshooting

### Frontend Still Calls Localhost

Check:

- [frontend/.env.production](/C:/Users/EricWeston/Desktop/SalePilot/frontend/.env.production)
- [request.ts](/C:/Users/EricWeston/Desktop/SalePilot/frontend/src/utils/request.ts)

Rebuild the frontend after changing `VITE_API_BASE_URL`.

### SSE Gets Stuck or Returns Late

Check:

- reverse proxy buffering is disabled
- reverse proxy read timeout is at least several minutes
- backend can reach the configured AI provider

### Login Works but Refresh Fails

Check:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- system time on the server
- that the frontend and backend are using the same deployed API origin

### AI Endpoints Fail in Production

Check:

- `AI_PROVIDER`
- provider API key
- provider model name
- outbound network access from the backend host

## Railway And Render

This repo now includes deployment config files:

- Railway backend service: [backend/railway.json](/C:/Users/EricWeston/Desktop/SalePilot/backend/railway.json)
- Railway frontend service: [frontend/railway.json](/C:/Users/EricWeston/Desktop/SalePilot/frontend/railway.json)
- Render Blueprint: [render.yaml](/C:/Users/EricWeston/Desktop/SalePilot/render.yaml)

### Railway

Recommended Railway setup uses two services in the same repo:

1. Backend service
2. Frontend service

For the backend service:

- set the service root directory to `backend`
- set the config-as-code path to `/backend/railway.json`
- provide the same variables listed in [backend/.env.example](/C:/Users/EricWeston/Desktop/SalePilot/backend/.env.example)

For the frontend service:

- set the service root directory to `frontend`
- set the config-as-code path to `/frontend/railway.json`
- set `VITE_API_BASE_URL` to your public backend URL, for example `https://salepilot-api.up.railway.app/api`
- set `VITE_SITE_URL` to your public frontend URL, for example `https://salepilot.up.railway.app`

### Render

Render can use the included Blueprint directly:

1. Create a new Blueprint from this repo.
2. Render will read [render.yaml](/C:/Users/EricWeston/Desktop/SalePilot/render.yaml).
3. Fill all `sync: false` variables during the initial creation flow.

Important `sync: false` values you must provide:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `FRONTEND_PUBLIC_URL`
- `BACKEND_PUBLIC_URL`
- `SWAGGER_SERVER_URL`
- `CORS_ALLOWED_ORIGINS`
- `VITE_API_BASE_URL`
- `VITE_SITE_URL`
- whichever AI provider key you actually use

For Render static frontend deployments, set `VITE_API_BASE_URL` to the backend public URL plus `/api`, for example `https://salepilot-backend.onrender.com/api`. Also set `VITE_SITE_URL` to the public frontend origin so canonical and Open Graph URLs resolve correctly.

### Vercel

Frontend Vercel config is now included at [frontend/vercel.json](/C:/Users/EricWeston/Desktop/SalePilot/frontend/vercel.json).

Recommended setup:

1. Create a Vercel project from this repo.
2. Set the Root Directory to `frontend`.
3. Vercel will read [frontend/vercel.json](/C:/Users/EricWeston/Desktop/SalePilot/frontend/vercel.json).
4. Set `VITE_API_BASE_URL` and `VITE_SITE_URL` in Vercel Environment Variables.

Recommended production value:

- `VITE_API_BASE_URL=https://api.example.com/api`
- `VITE_SITE_URL=https://app.example.com`

This Vercel config does three things:

- uses the Vite framework preset
- outputs the built SPA from `dist`
- rewrites all deep links to `index.html` so Vue Router works on refresh

It also adds immutable caching for hashed assets under `/assets/*`.

## MongoDB Atlas

The backend now supports Atlas-oriented connection settings in addition to the base `MONGODB_URI`. The parsing and defaults live in [mongoConfig.js](/C:/Users/EricWeston/Desktop/SalePilot/backend/utils/mongoConfig.js), and both the API server and index sync script use the same config path.

Recommended production values:

- `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
- `MONGODB_DB_NAME=salepilot`
- `MONGODB_APP_NAME=salepilot-backend`
- `MONGODB_MAX_POOL_SIZE=20`
- `MONGODB_MIN_POOL_SIZE=0`
- `MONGODB_TLS=true`

Optional tuning values:

- `MONGODB_MAX_IDLE_TIME_MS`
- `MONGODB_WAIT_QUEUE_TIMEOUT_MS`
- `MONGODB_SERVER_SELECTION_TIMEOUT_MS`
- `MONGODB_CONNECT_TIMEOUT_MS`
- `MONGODB_SOCKET_TIMEOUT_MS`
- `MONGODB_COMPRESSORS`

To verify Atlas credentials before deploying the full app:

```bash
cd backend
npm run check:mongodb
```

To apply schema indexes after the first Atlas deployment:

```bash
cd backend
npm run sync-indexes
```

## CORS And Security Headers

The backend now applies configurable CORS and browser security headers. The implementation lives in [securityHeadersMiddleware.js](/C:/Users/EricWeston/Desktop/SalePilot/backend/middlewares/securityHeadersMiddleware.js).

Default protections now include:

- origin allowlist CORS instead of unconditional allow-all
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` on HTTPS requests
- `Content-Security-Policy` on API responses, while skipping Swagger UI paths by default so docs keep working

Most useful production variables:

- `CORS_ALLOWED_ORIGINS=https://app.example.com`
- `CORS_ALLOW_CREDENTIALS=false`
- `CONTENT_SECURITY_POLICY=...`
- `SECURITY_CSP_SKIP_PATHS=/api/docs,/api/docs/openapi.json`
- `HSTS_ENABLED=true`
- `HSTS_MAX_AGE=31536000`
