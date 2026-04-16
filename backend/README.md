# Backend Split Target

This folder is the target home for the backend app during the split.

## Intended contents
- API routes and handlers
- DB models and data access
- Auth/session verification logic
- Push notification and scheduled job logic

## Deployment target
- Host: Render
- Secrets stay server-side only
- CORS must allow frontend domain(s)

## Security notes
- Protect internal endpoints with INTERNAL_API_KEY and CRON_SECRET
- Keep push and cron routes private
