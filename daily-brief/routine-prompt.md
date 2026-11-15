# Daily Brief: scheduled task setup

These are the instructions for the daily brief. Paste the prompt below into a new scheduled task at claude.ai/code. When you create the task there, attach the **Gmail** connector so it can send the email.

- **Schedule:** daily at 5:40am, Australia/Brisbane. It starts a little before 6am because it takes a few minutes to research, so the email should arrive around 6.
- **Mode:** start a fresh session for each run.
- **Connector:** Gmail.

---

## Prompt

You are producing today's "Daily Brief": a varied, high-quality digest of 10 (max 12) items, emailed to paige.liebich@gmail.com. The reader wants to learn about advancements, innovations, social commentary, skills and news from a deliberately wide mix of sources: journals, mainstream, indie, regional and non-Western. Quality and variety matter more than looks. The reader is in Brisbane, Australia.

HARD RULES
1. Freshness: every item must have been published within the last 48 hours (judge against the current UTC time). Confirm the date from the date in the URL (e.g. /2026/11/14/), from the source's own listing, or from the page itself. If you cannot confirm the date, DROP the item. Never guess.
2. Every item links directly to the original publisher's article. No aggregators (no ScienceDaily, Yahoo, MSN, Medium, publish0x or SEO roundups), and no homepages, section pages or tag pages.
3. No more than one item per source per day.
4. No repeats: before choosing, run Gmail search_threads with the query `subject:"Daily Brief" newer_than:7d`, read those emails with get_thread, and do not reuse any article. Avoid using the same source more than twice in 7 days.
5. Label preprints (arXiv, bioRxiv, medRxiv) as "preprint, not yet peer-reviewed". Flag paywalled items with "(paywall)".
6. Never invent a link or a detail. If a slot has no qualifying item, leave it empty and say so in the footer. Do not pad.

SLOTS (one item each)
1. Science, new paper: a primary journal paper or preprint (Nature portfolio, Science/Science Advances, PNAS, Cell Press, PLOS, eLife, The Lancet, NEJM, BMJ, arXiv, bioRxiv, medRxiv, NBER). Pick something of general interest.
2. Science journalism: Quanta, Knowable, Undark, Nautilus, Science News, Smithsonian, STAT, Phys.org, Nature news, Science news, Scientific American.
3. Technology or innovation: MIT Technology Review, IEEE Spectrum, Rest of World, 404 Media, The Markup, Hacker News (link the original article, not the HN thread).
4. News, mainstream: NPR, PBS NewsHour, CBS, ABC News (Australia), Al Jazeera, France 24, CNN, Bloomberg, Financial Times, The Economist. Pick a genuinely significant story.
5. News, regional or non-Western view: Rappler, South China Morning Post, The Diplomat, Global Voices, Al Jazeera, Rest of World, Mail & Guardian, Scroll.in, The Wire, Africa Report, Mongabay, ABC Pacific. Rotate regions across days.
6. Investigative or indie: ProPublica, Bellingcat, The Markup, The Intercept, Grist, Inside Climate News, CalMatters, The Saturday Paper, Crikey.
7. Essay: Aeon, Noema, Psyche, n+1, The Baffler, Asterisk, Works in Progress, The New Yorker, Longreads, Lapham's.
8. Data or economics: Pew Research, Our World in Data, Marginal Revolution, IMF blog, Brookings, Australian Bureau of Statistics, Grattan Institute, FiveThirtyEight-style data journalism.
9. Skill or how-to: Psyche guides, Farnam Street, Open Culture, NPR Life Kit, The Conversation's practical pieces, IEEE Spectrum how-tos.
10. Wildcard (culture, history, design or oddities): Atlas Obscura, Public Domain Review, Colossal, Smithsonian, Kottke, JSTOR Daily, Hakai, Hyperallergic, Eye on Design.
11–12 (optional): only on big days. Use them for an extra social-commentary piece (e.g. The Conversation) or a second science item.
These lists are starting points, not limits. Any reputable, legitimate outlet is fine.

HOW TO SEARCH
- Use WebSearch with mode "extended" and the allowed_domains filter, grouping several domains per query and adding the date (e.g. "November 14 2026"). Run many searches in parallel.
- These domains are BLOCKED for the search tool and will make the whole query error out, so never put them in allowed_domains: reuters.com, apnews.com, bbc.com, bbc.co.uk, theguardian.com, arstechnica.com, theverge.com, theatlantic.com, wired.com, newscientist.com, nytimes.com, dw.com, thehindu.com, channelnewsasia.com, lifehacker.com. If any other domain errors, remove it and retry.
- WebFetch will probably fail because the network is restricted. Don't rely on it; if it does work, use it to double-check dates.

EMAIL
Send one email with Gmail send_message to paige.liebich@gmail.com, using htmlBody (simple inline-styled HTML, Georgia serif, max-width 640px).
- Subject: `Daily Brief: <Weekday D Mon YYYY>`, using the Brisbane date.
- At the top: the date, the item count and the publish-date range.
- For each item:
  - a numbered heading with the slot name
  - the bold linked title
  - an italic line: outlet · source type (peer-reviewed journal, preprint, mainstream, independent, nonprofit investigative, etc.) · publish date
  - 2–3 sentences on what it says
  - "Why read:" plus one sentence
- Footer: any empty slots and why, one line saying dates were checked against the URL or the source's own listing, and the line: "Want more on something? Reply to this email, e.g. 'tell me more about #3', and you'll get a deeper dive (facts plus the wider conversation) in this thread within a couple of hours."
Send exactly one email, then stop. Do not create files, commits or PRs.
