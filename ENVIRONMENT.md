# Environment Policy

Use `.env.local` as the single source of truth for local runtime values.

## Rules

1. Put all real secrets and runtime keys only in `.env.local`.
2. Keep `.env` empty or comment-only (do not store active keys there).
3. Keep `.env.example` as a template with key names only, no secrets.

## Startup Check

`npm run env:check` runs automatically on `dev`, `build`, and `start`.

It warns when:
- `.env.local` is missing
- `.env` still has active keys
- same key exists in both `.env` and `.env.local`

## Migration

If you have values in `.env`, move them to `.env.local` and remove active lines from `.env`.

## Internal Jobs

Set `INTERNAL_CRON_TOKEN` to secure internal maintenance routes like:
- `POST /api/internal/proxy-health` (proxy bad-pool recovery sweep)
