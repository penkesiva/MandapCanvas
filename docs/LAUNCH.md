# First 10 paying customers — launch kit

Target: **7 couples + 3 decorators in 45 days**, starting in the Bay Area (where you can meet people in person), then
New Jersey, Dallas/Houston, Chicago and Atlanta. Prospect seeds are in `docs/prospects.csv`.

## Before day 1 (one evening)

- [ ] Deploy with real keys; run 10 real albums yourself (one per tradition) and keep the best 30 images.
- [ ] Replace the gallery samples with your best real outputs (`public/samples`).
- [ ] Create the Stripe coupons `FOUNDING` ($20 off Signature, 25 uses) and `FOUNDINGPRO` (50% × 6 months, 10 uses).
- [ ] Make 3 "proof" albums you can show on your phone: a Punjabi Sangeet, a Telugu Muhurtham, a Gujarati Garba.
- [ ] Set up a simple tracker (copy `prospects.csv` into a sheet; add Status, Last touch, Next step).

## The two motions

### Couples — "show, don't pitch"

Couples buy when they see *their* idea rendered. Every touch ends with the free preview link.

| Channel | Action | Volume |
| --- | --- | --- |
| Friends & family network | Personal message to everyone you know who is engaged or has a sibling/cousin getting married in the next 12 months. Offer to make their first album with them on a call. | 30 messages, week 1 |
| r/DesiWeddings, r/IndianWeddings, r/weddingplanning | Read the rules first. Don't drop links: answer palette/decor questions with a rendered image of *their* described idea, and mention the tool only when asked. One "I built this" post where self-promo is allowed. | 3 helpful replies/day |
| Instagram & TikTok | Short before/after reels: sketch → render, and "same mandap in 4 palettes". Hashtags: #desiwedding #indianwedding #mandapdecor #bayareaindianwedding #njindianwedding #sangeet #haldi | 3 reels/week |
| Facebook groups | South Asian bride groups by metro (search "Desi brides Bay Area", "NJ Indian brides"). Same rule: help first. | 2 groups/day |
| Temples / community centers | Ask to leave a QR flyer at wedding-hall bookings desks (ICC Milpitas, local temples, gurdwaras, banquet halls). | 5 locations |

### Decorators — "make their sale for them"

A decorator's first meeting with a couple is where MandapCanvas earns its fee. Show up with their own work rendered.

1. Pick a prospect; screenshot one mandap from their Instagram/website.
2. Run it through MandapCanvas in 3 palettes they *don't* show (e.g. their red-gold mandap in blush-ivory, emerald, peach-sage).
3. Send the 3 images with the message below. No link in the first message.
4. If they reply, offer a 15-minute call or a visit to their warehouse; set them up on Pro with `FOUNDINGPRO` on the spot.

Volume: 10 decorators/day, 5 days a week. Expect ~10–15% replies and 1 in 3 replies to try Pro.

## Message scripts

**Couple — warm (friend of a friend)**
> Hi Priya! Congrats on the engagement 🎉 I built a tool that turns a mandap idea (sketch, Pinterest photo, anything)
> into realistic photos of your actual events in different colors — Mehndi, Sangeet, the ceremony, all of it. Would you
> want me to make you a couple of free previews? Just send me a picture of a decor idea you like and your two color
> options.

**Couple — community reply (when someone asks "blush or red for the mandap?")**
> I had the same debate, so I rendered both on the same mandap — here's what it looks like in each [2 images]. Blush
> reads softer in daylight; red-gold photographs better under evening uplighting. Happy to do yours if you share the
> setup.

**Decorator — cold DM / email (first touch)**
> Hi [Name], I loved the [specific mandap] you did at [venue]. I rendered it in three palettes your couples keep asking
> about — attached. I'm building MandapCanvas, which lets decorators sketch during a consultation and show the couple a
> photo-real version before they leave, with your logo on it. Would a 15-minute look be useful this week?

**Decorator — follow-up (day 4)**
> Quick follow-up — I can turn any one of your past setups into a branded proposal for a couple you're quoting right
> now, free, so you can see if it helps close. Want me to?

**Decorator — after a "yes"**
> Here's your proposal: [share link]. If it helps, the founding offer is 50% off Pro for 6 months (code FOUNDINGPRO) —
> and I'll personally set up your logo and first three proposals with you.

## 45-day plan

| Days | Couples | Decorators | Goal |
| --- | --- | --- | --- |
| 1–7 | Warm network (30 messages); 2 reels; daily community replies | Render 20 decorators' work; send 10/day | First paid album |
| 8–21 | Ask every buyer for a family-share screenshot + testimonial; 3 reels/week | Follow-ups; 5 demos; visit 2 Bay Area warehouses | 4 albums, 1 Pro |
| 22–35 | Founding code to groups; flyer at ICC/temples | Expand to NJ + Dallas lists | 6 albums, 2 Pro |
| 36–45 | Referral: each buyer gets a free +10 top-up (100%-off Stripe code) per couple they refer | Ask each Pro for 2 intros | 7 albums, 3 Pro |

## What to measure (all in `/admin` + Vercel Analytics)

- Visitors → free previews started → previews completed → checkout → paid (target ≥ 8% preview-to-paid)
- Decorator messages → replies → demos → Pro
- Image cost per paid album and daily margin
- Which tradition/palette combos convert — double down on those in reels

## Events worth attending

- **ICC South Asian Bridal Show** (India Community Center, 525 Los Coches St, Milpitas). Historically held in spring;
  vendor info via India Currents (bridal-show page). A table there puts you in front of hundreds of couples and every
  local decorator in one day — bring a laptop running live sketch → render.
- Regional Desi bridal expos in NJ (Edison), Dallas and Houston — check dates each season.

## Rules for yourself

- Lead with an image of *their* idea, every time.
- Never claim the decor will look exactly like the render — it's a concept preview.
- Ask before using anyone's photos or albums publicly.
- Reply to every buyer personally within 24 hours; the first 10 are your product team.
