# MandapCanvas — product & business plan

_October 2026_

## The one-line pitch

**See your Desi wedding before the first flower is ordered.** Sketch a mandap, upload a photo you love, or pick a style;
get a photo-real album of every event — decor, outfits and the two of you — in the palettes you're choosing between.

## Who pays, and why

| | Couples (and their families) | Decorators and planners |
| --- | --- | --- |
| Pain | Months of family debate over colors and decor; Pinterest boards that don't match their venue; fear the decor won't look like the promise | Long sales cycles; couples can't picture a sketch; losing bookings to whoever shows the best photos |
| Moment | 6–12 months before the wedding, choosing decorator and palette | First consultation, and proposal revisions |
| What they buy | One album, once ($29–$79) | A monthly tool that wins bookings ($99–$199) |
| Speed to first dollar | Fast — self-serve, impulse-priced | Slower — needs a demo, but each is worth ~$1,200/yr |

**Decision: sell to both, with different jobs.** Couples are the fastest path to the first paid customers (no sales call,
free preview → $49 checkout). Decorators are the path to recurring revenue and they bring couples with them — every
branded proposal they send is an ad. The site leads with couples; `/pro` is the decorator door.

Why "Desi weddings in the U.S." and not "South Indian": the same buyer behavior exists across Punjabi, Gujarati, Bengali,
Marathi, Telugu/Tamil, Sikh, Muslim, Christian and fusion weddings, and the multi-event week (Haldi → Mehndi →
Sangeet/Garba → ceremony → reception) is the common thread. Each tradition gets its own names, outfits and respectful
guardrails (e.g. no scripture rendered for Anand Karaj or Nikah).

## Product

1. **Start from your idea** — draw on a canvas (pen, brush, line, arch, shapes, templates), upload a sketch or photo, or
   pick one of six decor styles.
2. **Your wedding** — tradition, events, up to six palettes, indoor/outdoor, day/evening, notes.
3. **People** — optional photos for likeness (deleted in 7 days), or soft-focus "concept" faces.
4. **Album mix** — choose how many images per category (decor wide, decor details, bride, groom, couple, couple at the
   stage, family colors). A smart default fills it; the customer can rebalance.
5. **Free preview** — 2 watermarked images in about a minute, no account.
6. **Pay and watch it fill** — favorites, free regenerations, filters by event/shot/palette, family share link with
   voting, ZIP download, printable lookbook PDF.

Pro adds branded proposals (logo, name, contact on share pages and PDFs), client albums, and on Studio, inventory
reference photos so renders reuse the decorator's real mandaps and props.

## Pricing

| Pack | Price | Images | Events | Palettes | Free new versions |
| --- | --- | --- | --- | --- | --- |
| Starter | $29 | 25 | 2 | 2 | 3 |
| **Signature** (default) | **$49** | 50 | all | 4 | 6 |
| Grand | $79 | 100 (HD) | all | 6 | 12 |
| Top-up | $9 | +10 | | | |

| Plan | Monthly | Yearly | Images / month |
| --- | --- | --- | --- |
| Pro | $99 | $990 | 300 |
| Studio | $199 | $1,990 | 1,000 + inventory refs + 3 seats |

Rationale: $49 is under the cost of one decor consultation and an impulse buy against a $35k–$80k wedding; the anchor
($79) makes it feel safe. Per-image price falls with size so most couples choose 50. Decorators compare $99 to one lost
booking (typically $3k–$15k of decor revenue). Gross margin is ~90% on packs and 77–85% on plans (see `AUDIT.md`).

**Founding offers (first customers only):**
- Couples: Signature for $29 for the first 25 couples — a Stripe coupon ($20 off, max 25 redemptions) with promotion
  code `FOUNDING`. Checkout already accepts promotion codes.
- Decorators: 50% off for 6 months for the first 10 Pro accounts (coupon: 50%, repeating 6 months, max 10, code
  `FOUNDINGPRO`), in exchange for feedback and permission to show their work in the gallery. `/pro` tells them to email
  for the code.

## Goals

- **First paid customer:** within 14 days of launch.
- **First 10 paying customers:** within 45 days — target mix 7 couples + 3 decorators.
- **$1,000 MRR equivalent** (≈ 5 Pro + 10 albums/month) within 90 days.

The plan to get there is in `LAUNCH.md`.

## Risks

| Risk | Mitigation |
| --- | --- |
| AI images look "off" for a specific tradition | Free preview before payment; regenerations; tune prompts per tradition with real albums before launch; refund within 14 days |
| Likeness concerns / face data | Optional, deleted in 7 days, never on share links, clear policy |
| Cultural missteps | Tradition-specific guardrails; no religious text; invite community feedback |
| Image cost spikes / abuse | Daily cap, per-IP free-preview limit, per-album quotas |
| Model retirement (2.5 → March 2027) | Model is an env var; cost tracking follows; test 3.1 now |
| Seasonality (spring/fall peaks) | Decorator plans smooth revenue; push packs before peak booking months (Jan–Mar, Jul–Sep) |
