# Technical audit — MandapCanvas v0 → commercial v1

_October 2026_

## What existed (v0)

A single-page prototype: upload one sketch, pick a palette and a few options, `POST /api/generate` returned 1–4 Gemini
images. No accounts, storage, payments, sharing, or limits.

| Area | v0 | Risk |
| --- | --- | --- |
| Product | 1–4 images of the mandap only | Nothing to sell beyond a toy; no outfits, events or people |
| Positioning | South Indian only | Excludes most of the U.S. Desi wedding market |
| Abuse / cost | Open endpoint, no rate limit or cap | Anyone could run up the Gemini bill |
| Persistence | None — images lived in the browser tab | Customer loses work on refresh |
| Long jobs | One request, 120 s | A 50-image album can't finish in one request |
| Payments | None | — |
| Privacy | n/a | Would need a policy the moment faces are uploaded |

The prompt builder and palette data were a good start and their ideas carried into `lib/prompts.ts` and `lib/catalog.ts`.

## What v1 is

```
Browser ──► Next.js 16 (Vercel, Node runtime)
              ├─ /create wizard ── upload (sharp: resize, strip EXIF/GPS) ──► Vercel Blob
              ├─ /api/albums ───── album JSON, credits, locks, stats ──────► Upstash Redis
              ├─ /api/albums/[id]/advance ── 3 shots per call ──► Gemini image ──► Blob
              ├─ /api/checkout ── Stripe Checkout (inline prices) ◄── /api/stripe/webhook
              ├─ magic-link auth (HMAC cookies) ── Resend email
              └─ crons: face-photo cleanup (7 days), finish abandoned paid albums
```

Key decisions:

- **Client-driven batch generation.** The album page calls `/advance` in a loop (3 images per call, ~30–60 s), guarded by a
  Redis lock so two tabs never double-generate. A cron finishes albums if the tab is closed. No queue service needed.
- **Credits ledger, not "paid flag".** Packs and plans add credits; generation spends them atomically. Top-ups, refunds and
  subscriptions all use the same path. Fulfillment is idempotent per Stripe session (`fulfilled:{ref}` with NX).
- **Inline Stripe prices.** Prices live in `lib/config.ts`; nothing to configure in the Stripe dashboard except the webhook.
- **Daily spend cap** (`DAILY_COST_CAP_CENTS`, default $50). When hit, generation pauses with a clear message and resumes
  the next UTC day. `/admin` shows revenue, image cost and margin per day.
- **Free preview economics.** 2 watermarked images per album, 6 per IP per day → worst case ≈ $0.25 per visitor-day.
- **Privacy by default.** Face photos are optional, normalized on upload, never exposed on share links (`publicAlbum`
  strips them), and deleted after 7 days. Image proxy endpoints only serve our own blob URLs (SSRF guard).
- **Zero-account dev mode.** File-based KV and blob, placeholder images, test checkout and console magic links, so the
  whole flow — including payment and a 100-image album — runs offline. Production disables every fallback.

## Unit economics

Gemini list prices: `gemini-2.5-flash-image` ≈ $0.039/image (default; retires 2027-03-15),
`gemini-3.1-flash-image` ≈ $0.067/image at 1K. Stripe 2.9% + $0.30. Images counted include the 2 free previews and all
free regenerations being used.

| Product | Price | Images (max) | Image cost 2.5 / 3.1 | Stripe | Gross margin 2.5 / 3.1 |
| --- | --- | --- | --- | --- | --- |
| Starter | $29 | 30 | $1.17 / $2.01 | $1.14 | 92% / 89% |
| Signature | $49 | 58 | $2.26 / $3.89 | $1.72 | 92% / 89% |
| Grand | $79 | 114 | $4.45 / $7.64 | $2.59 | 91% / 87% |
| Top-up | $9 | 10 | $0.39 / $0.67 | $0.56 | 89% / 86% |
| Pro (monthly) | $99 | 300 | $11.70 / $20.10 | $3.17 | 85% / 77% |
| Studio (monthly) | $199 | 1,000 | $39.00 / $67.00 | $6.07 | 77% / 63% |

Fixed costs at launch: Vercel Pro $20/mo (recommended for the 10-minute cron and longer functions), domain ~$15/yr;
Upstash, Blob and Resend fit in free tiers for the first few hundred albums.

**Model recommendation.** Launch on `gemini-2.5-flash-image` (cheapest, proven), then A/B `gemini-3.1-flash-image` on
10 real albums before 2.5 retires in March 2027. Set `GEMINI_IMAGE_MODEL`; costs in `/admin` follow automatically. Grand
packs request HD output where the model supports it.

## Verified

- `tsc --noEmit`, `eslint`, `next build` (also from a clean copy with no env file)
- Playwright end-to-end in mock mode: draw + template → Sikh wedding → validation → watermarked previews → test checkout →
  50-image generation → favorite, regenerate, filters, lightbox → share link + family voting → ZIP → print lookbook →
  top-up to 60 → account; Pro: sign-in → subscribe → branding → 25-image proposal → admin; another user cannot open the album;
  all marketing and legal pages; mobile.

## Known gaps / next

1. **Real-image QA.** The pipeline was tested with placeholder images. Before charging, run ~10 real albums per tradition
   with a real key and tune `lib/prompts.ts` (likeness strength, Sikh/Nikah guardrails, outfit accuracy).
2. **Sample images.** `npm run fetch-samples` pulls the marketing images; commit them. Replace with real customer albums
   (with permission) as soon as you have them.
3. **Seats for Studio** are promised in copy but invitations aren't built — handle the first Studio customers manually.
4. **Refunds** are manual from the Stripe dashboard; credits aren't clawed back automatically.
5. **Analytics.** Vercel Analytics custom events (`track()`) are wired on the wizard; enable Web Analytics on the project.
6. **Legal pages** are a sensible starting draft, not legal advice. Have them reviewed before scale.
