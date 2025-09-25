# Deployment Playbook

## Local Development
- Install dependencies with `npm ci`.
- Use `npm run dev` for the full authenticated shell.
- Toggle a minimal dashboard shell with `VITE_USE_SIMPLE_APP=true npm run dev`.
- Always run `npm run lint` and `npm test -- --run` before pushing changes.

## Build Verification
1. `npm run lint`
2. `npm test -- --run`
3. `npm run build`

The build emits static assets into `dist/` which are served by `server-fixed.js`.

## Render Deployment
Rendered environments are described in `render.yaml` and share the same build/start commands:

```
build:  npm ci && npm run build
start:  npm run start
```

`npm run start` boots the Express wrapper (`server-fixed.js`) that serves the production bundle and WebSocket endpoints.

Environment variables:
- `NODE_ENV=production` (default)
- `PORT=10000` (matches Render health checks)
- `VITE_USE_SIMPLE_APP=false` (optional; defaults to full experience)

Deploying a branch automatically builds the React bundle, generates the server artifact, and starts the service. No database or Prisma migration steps are required for this trimmed deployment profile.

## Rollback
- Each deployment keeps the generated `dist/` assets. Re-deploying an earlier commit triggers a fresh build with the same workflow above.
- The previous, full enterprise stack configuration is preserved under `legacy/render.yaml.original` should you need to restore the historical multi-service setup.
