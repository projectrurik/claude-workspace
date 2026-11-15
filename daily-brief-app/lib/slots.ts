// The ten daily slots. Source pools don't overlap, so two slots, which are
// researched separately and in parallel, can't both pick the same outlet.
export interface Slot {
  n: number;
  name: string;
  brief: string;
  sources: string[];
}

export const SLOTS: Slot[] = [
  {
    n: 1,
    name: "Science: new paper",
    brief:
      "A primary research paper or preprint that a curious non-specialist would find genuinely interesting. Link the paper itself (or the journal's own article page). If it's a preprint, mark it as one.",
    sources: [
      "nature.com (research articles)",
      "science.org (Science, Science Advances)",
      "pnas.org",
      "cell.com",
      "journals.plos.org",
      "elifesciences.org",
      "thelancet.com",
      "nejm.org",
      "bmj.com",
      "arxiv.org",
      "biorxiv.org",
      "medrxiv.org",
      "nber.org",
    ],
  },
  {
    n: 2,
    name: "Science journalism",
    brief: "A well-reported science story or feature explaining a new finding or idea.",
    sources: [
      "quantamagazine.org",
      "knowablemagazine.org",
      "undark.org",
      "nautil.us",
      "sciencenews.org",
      "statnews.com",
      "phys.org",
      "scientificamerican.com",
      "hakaimagazine.com",
    ],
  },
  {
    n: 3,
    name: "Technology & innovation",
    brief:
      "A significant technology, engineering or innovation story: something new being built, or the consequences of tech for people.",
    sources: [
      "technologyreview.com",
      "spectrum.ieee.org",
      "404media.co",
      "techcrunch.com",
      "news.ycombinator.com (link the original article, never the HN thread)",
    ],
  },
  {
    n: 4,
    name: "News: mainstream",
    brief:
      "The most genuinely significant news story of the last day or two, from a major mainstream outlet. Prefer substance over spectacle.",
    sources: [
      "npr.org",
      "pbs.org/newshour",
      "abc.net.au/news",
      "cbsnews.com",
      "france24.com",
      "cnn.com",
      "bloomberg.com",
      "ft.com",
      "economist.com",
    ],
  },
  {
    n: 5,
    name: "News: regional / non-Western view",
    brief:
      "A story reported from outside the US/UK/Australia mainstream, ideally by an outlet based in the region it covers. Rotate regions across days (Asia, Africa, Latin America, Middle East, Pacific, Eastern Europe).",
    sources: [
      "aljazeera.com",
      "restofworld.org",
      "rappler.com",
      "scmp.com",
      "thediplomat.com",
      "globalvoices.org",
      "mg.co.za",
      "scroll.in",
      "thewire.in",
      "theafricareport.com",
      "news.mongabay.com",
      "abc.net.au/pacific",
      "kyivindependent.com",
    ],
  },
  {
    n: 6,
    name: "Investigative / indie",
    brief: "Original investigative or accountability reporting from an independent or nonprofit newsroom.",
    sources: [
      "propublica.org",
      "bellingcat.com",
      "themarkup.org",
      "theintercept.com",
      "grist.org",
      "insideclimatenews.org",
      "calmatters.org",
      "crikey.com.au",
      "thesaturdaypaper.com.au",
    ],
  },
  {
    n: 7,
    name: "Essay & ideas",
    brief: "A thoughtful long-form essay on ideas, philosophy, society or culture.",
    sources: [
      "aeon.co",
      "noemamag.com",
      "nplusonemag.com",
      "thebaffler.com",
      "asteriskmag.com",
      "worksinprogress.co",
      "newyorker.com",
      "longreads.com",
      "laphamsquarterly.org",
      "theconversation.com",
    ],
  },
  {
    n: 8,
    name: "Data & economics",
    brief: "New data, a survey, or an economic analysis that tells you something concrete about the world.",
    sources: [
      "pewresearch.org",
      "ourworldindata.org",
      "marginalrevolution.com",
      "imf.org/en/Blogs",
      "brookings.edu",
      "abs.gov.au",
      "grattan.edu.au",
      "voxeu.org",
    ],
  },
  {
    n: 9,
    name: "Skill / how-to",
    brief:
      "A practical, evidence-informed guide that teaches a skill or a better way of doing something (thinking, learning, making, health, money, relationships).",
    sources: [
      "psyche.co/guides",
      "fs.blog",
      "npr.org/lifekit",
      "openculture.com",
      "lifehack-style content only from reputable outlets",
    ],
  },
  {
    n: 10,
    name: "Wildcard",
    brief: "Something delightful and surprising: culture, history, design, art, nature or oddities.",
    sources: [
      "atlasobscura.com",
      "publicdomainreview.org",
      "thisiscolossal.com",
      "smithsonianmag.com",
      "kottke.org",
      "daily.jstor.org",
      "hyperallergic.com",
      "eyeondesign.aiga.org",
    ],
  },
];

// Aggregators and content farms: never link these.
export const BLOCKED_DOMAINS = [
  "msn.com",
  "yahoo.com",
  "news.google.com",
  "sciencedaily.com",
  "medium.com",
  "publish0x.com",
  "flipboard.com",
  "newsbreak.com",
];
