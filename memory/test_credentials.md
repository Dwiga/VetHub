# Test credentials

This app uses **Clerk** for authentication. No app-managed test accounts exist yet.

## Clerk configuration

The frontend is wired for Clerk but ships with placeholder keys. To exercise
sign-in / sign-up and any authenticated endpoint, replace the following in
`/app/frontend/.env`:

```
VITE_CLERK_PUBLISHABLE_KEY="pk_test_REPLACE_ME"
CLERK_PUBLISHABLE_KEY="pk_test_REPLACE_ME"
CLERK_SECRET_KEY="sk_test_REPLACE_ME"
```

with real keys from https://dashboard.clerk.com/ → API Keys.

Then restart the frontend service: `sudo supervisorctl restart frontend`.

While placeholder keys are in place:
- The landing page (`/`) renders fully.
- `/sign-in/*` and `/sign-up/*` display a yellow "Clerk not configured" notice.
- Auth-gated routes (`/dashboard`, `/pets`, `/pets/:petId`) redirect to `/sign-in`.
- Public API routes (`/api/health`, `/api/species`) work.
- Authenticated API routes (`/api/users/me`, `/api/pets`, `/api/pets/:petId`,
  `/api/users/me/register-pet-owner`, `/api/visits`) correctly return **401
  unauthorized**.
