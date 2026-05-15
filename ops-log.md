# Ops Log — PetHub VPS (pethub.silvertech.dev)

## 2025-05-15 — Share Visit Feature + Species Fix

### What was deployed

**Feature: Share Visit (public receipt link)**
- New column `share_token TEXT UNIQUE` added to `visits` table
- `POST /api/visits/:visitId/share` — auth-required endpoint; generates a UUID token on first call, returns the existing one on repeat calls, plus a ready-to-share URL
- `GET /api/visits/shared/:token` — fully public (no auth); returns complete visit detail
- New frontend page at `/visit/share/:token` — mobile-optimized receipt (billing, items, daily reports); unauthenticated visitors see a sign-up/sign-in prompt
- Share button (Share2 icon) added to the vet visit detail page header; clicking generates the link, copies it to clipboard, and offers a WhatsApp share link in the toast

**Species seed (jenis hewan)**
- The VPS production database had no species data
- Seeded 10 species in Indonesian: Anjing, Kucing, Kelinci, Burung, Hamster, Guinea Pig, Reptil, Ikan, Ular, Kura-kura

### Manual one-time actions performed on VPS (via SSH)

These were applied manually because they were data-only changes not expressible as code commits:

1. **DB column migration** (applied before the new API code was deployed):
   ```sql
   ALTER TABLE visits ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
   ```

2. **Species seed** (applied after deploy confirmed containers healthy):
   ```sql
   INSERT INTO species (name) VALUES
     ('Anjing'), ('Kucing'), ('Kelinci'), ('Burung'),
     ('Hamster'), ('Guinea Pig'), ('Reptil'), ('Ikan'),
     ('Ular'), ('Kura-kura')
   ON CONFLICT (name) DO NOTHING;
   ```

### Going forward — these are now automated in GitHub Actions

The deploy workflow (`.github/workflows/deploy.yml`) now runs both steps automatically after every deploy, so no manual SSH is needed in the future:
- `ALTER TABLE visits ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;`
- Species INSERT with `ON CONFLICT (name) DO NOTHING`

Any new DB migrations or seed data should be added to the deploy workflow in the same pattern.
