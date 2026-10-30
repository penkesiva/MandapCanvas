# MandapCanvas

Photo-real preview albums for Desi weddings in the U.S. Couples (or their decorator) sketch a mandap, upload a photo, or
pick a style; MandapCanvas renders a full album across every event — Haldi, Mehndi, Sangeet/Garba, the ceremony and the
reception — in the palettes they're deciding between, with matching outfits and, optionally, their own likeness.

- **Couples** pay once per album: Starter 25 images $29 · Signature 50 $49 · Grand 100 $79 · +10 images $9.
- **Decorators** subscribe: Pro $99/mo (300 images, branded proposals) · Studio $199/mo (1,000 images, inventory references, 3 seats).
- Every album starts with **2 free watermarked previews** (no account).

See `docs/PLAN.md` for positioning and pricing, `docs/AUDIT.md` for the technical audit and unit economics, and
`docs/LAUNCH.md` for the first-10-customers plan.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
- Gemini image generation via `@google/genai` (server-only)
- Upstash Redis (data, credits, locks, stats) · Vercel Blob (images) · Stripe Checkout + Billing · Resend (email)
- Every external service has a local fallback, so the whole app runs with **zero accounts** in development.

## Run it locally

```bash
npm install
npm run fetch-samples      # downloads the marketing images into public/samples (one time, then commit them)
cp .env.example .env.local # optional — everything works with it empty
npm run dev
```

With no keys set, development uses:

| Service | Local fallback |
| --- | --- |
| Gemini | placeholder images (`MOCK_GENERATION=1` forces this even with a key) |
| Redis | JSON file at `.data/kv.json` |
| Blob | files in `.data/blob`, served by `/api/dev-blob` |
| Stripe | a test checkout page at `/checkout/dev` |
| Resend | magic links printed in the terminal and shown on the sign-in page |

Delete `.data/` to reset.

## Deploy (Vercel)

1. Import the repo in Vercel.
2. Add storage from the Vercel dashboard: **Upstash for Redis** (Marketplace) and a **Blob** store. Both set their env vars.
3. Set the remaining env vars from `.env.example`: `GEMINI_API_KEY`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`,
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `ADMIN_EMAILS`.
4. In Stripe, add a webhook to `https://YOUR_DOMAIN/api/stripe/webhook` with the five events listed in `.env.example`.
   No products need to be created — prices live in `lib/config.ts`.
5. In Resend, verify your sending domain.
6. Open `/admin` (signed in with an `ADMIN_EMAILS` address) — the setup panel shows anything still missing.

Production refuses to run without `AUTH_SECRET`, never shows the test checkout, and never falls back to placeholder images.

**Crons** (`vercel.json`): `/api/cron/cleanup` deletes face photos older than 7 days; `/api/cron/advance` finishes any
paid album whose owner closed the tab. Both are daily so they deploy on the Hobby plan; on Vercel Pro change the advance
schedule to `*/10 * * * *`.

## How it works

- `lib/catalog.ts` — traditions, events, palettes, decor presets, shot categories. Edit here to add a tradition or palette.
- `lib/prompts.ts` — the prompt for every shot (framing, blueprint, palette, outfits, people rules, respect guardrails).
- `lib/albums.ts` — album lifecycle: plan shots, free preview, fund, batch generation with locks and retries, sharing.
- `lib/billing.ts` — Stripe checkout, subscriptions, idempotent fulfillment, credits.
- `lib/config.ts` — packs, plans, limits, feature flags.
- Generation is driven by the open album page (`/api/albums/[id]/advance`, 3 images per call) with the cron as a safety net.
- Spend is capped per day (`DAILY_COST_CAP_CENTS`); `/admin` shows revenue, image cost and margin.

## Privacy

Face photos are optional, stripped of EXIF/GPS on upload, never shown on share links, and deleted after 7 days.
Albums are private until the owner creates a share link.
