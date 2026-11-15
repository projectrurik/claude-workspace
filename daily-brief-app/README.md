# Daily Brief

A personal daily reading app you install on your phone's home screen. Every morning between 5 and 6am (Brisbane time) it researches 10 fresh items. Each one comes from a different kind of source, was published in the last 48 hours, has had its date checked, and links to the original publisher. Tap any item to get a deeper dive covering the facts and the wider conversation around it, then ask follow-up questions.

## How it works

- **Morning research:** Vercel runs 10 scheduled jobs at 19:00–19:30 UTC (5–6am Brisbane). Each job researches one slot with Claude, using web search and web fetch, and saves the item. Slots run separately, so one slow search can't hold up the rest.
- **Tell me more:** the "Tell me more", "What are people saying?" and "Ask" buttons stream an answer from Claude as it researches. Answers are saved, so reopening an item costs nothing.
- **No repeats:** each slot is told what was used in the last 7 days.
- **Storage:** a private Vercel Blob store. Nothing is public.
- **Login:** one passcode (`APP_PASSCODE`) protects the whole app, so nobody else can use your API credit.

Slots and source lists are in `lib/slots.ts`. The research rules are the prompts in `lib/claude.ts`.

## Setup (about 10 minutes)

1. **Get a Claude API key.** Go to [console.anthropic.com](https://console.anthropic.com), add credit, and create an API key. Set a monthly spend limit there too (Settings → Limits).
2. **Create the Vercel project.** In [vercel.com/new](https://vercel.com/new), import the `projectrurik/claude-workspace` GitHub repo and set **Root Directory** to `daily-brief-app`. Vercel deploys the repo's production branch, so either merge this code into `main`, or set the production branch under Settings → Git.
3. **Add storage.** In the project's **Storage** tab, create a **Blob** store with **Private** access and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN` automatically.
4. **Add environment variables** (Settings → Environment Variables):

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your key from step 1 |
   | `APP_PASSCODE` | any passcode you'll remember |
   | `CRON_SECRET` | a long random string (Vercel sends it with the scheduled jobs) |
   | `CLAUDE_MODEL` | optional; defaults to `claude-opus-5-5` |
   | `CLAUDE_EFFORT` | optional: `low`, `medium`, `high` (default) or `xhigh` |

5. **Redeploy** so the variables take effect (Deployments → ⋯ → Redeploy).
6. **Put it on your phone.** Open the site and enter your passcode.
   - iPhone: in Safari, tap Share → **Add to Home Screen**.
   - Android: in Chrome, tap ⋮ → **Install app**.
7. **First brief:** tap **Generate today's brief**. It takes a few minutes. After that, a new brief appears each morning.

## Cost

You pay Anthropic directly for API usage, and Vercel's free Hobby plan covers the hosting. This is a rough estimate; check the usage page in the Console after a few days for real numbers:

- **Daily brief:** about $2.50–4.50 a day on Claude Opus 5.5, which covers 10 researched items including web searches at $10 per 1,000.
- **Each new "tell me more":** about $0.30–0.60. Reopening a saved answer is free.

To cut costs, set `CLAUDE_MODEL=claude-sonnet-5-5`, which has roughly half the per-token price, and/or `CLAUDE_EFFORT=medium`.

## Local development

```bash
npm install
APP_PASSCODE=test ANTHROPIC_API_KEY=... npm run dev
```

Without `BLOB_READ_WRITE_TOKEN`, data is written to `./.localdata`.
