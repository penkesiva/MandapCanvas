# MandapCanvas

MandapCanvas turns wedding sketches into realistic decor previews. Upload a hand-drawn mandap or backdrop, choose scene options, and generate 1–4 image variations with Gemini image generation.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Google Gemini image models via `@google/genai` (server-side only)

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).

   Optionally set `GEMINI_IMAGE_MODEL` to switch models (default: `gemini-2.5-flash-image`).

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Vercel deployment

This repo includes **`vercel.json`** so Vercel uses the same install/build commands as local production builds (`npm ci` + `npm run build`). GitHub Actions (**`.github/workflows/ci.yml`**) runs the same steps on every push/PR to `main`.

1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com/new), **Import** the GitHub repo (Next.js is detected automatically).
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` — required for generation.
   - `GEMINI_IMAGE_MODEL` — optional (see [Local development](#local-development)).
4. Deploy. Vercel will run `npm ci` and `npm run build` as configured.

**CLI (optional):** install the [Vercel CLI](https://vercel.com/docs/cli), run `vercel link` in the project root, then `vercel` for a preview or `vercel --prod` for production.

Generation runs on the server route `POST /api/generate`. For long runs or multiple parallel images, ensure your Vercel plan allows sufficient function duration (`maxDuration` is set to 120 seconds in the API route; lower tiers may cap lower).

## Project layout

- `app/page.tsx` — main flow (upload, options, results)
- `app/api/generate/route.ts` — multipart upload, prompt build, Gemini calls
- `lib/promptBuilder.ts` — prompt text from user settings
- `lib/palettes.ts` — U.S.-oriented floral palette data
- `lib/geminiImage.ts` — Gemini image generation wrapper
- `components/*` — UI panels

## License

Private / your choice — add a license file when you publish.
