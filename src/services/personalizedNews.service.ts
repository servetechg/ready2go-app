import { MOCK_BLUE_SKY_NEWS } from '@/constants/emergency';
import { resolveStateLabel, US_STATE_NAMES } from '@/constants/usStates';
import { apiRequest } from '@/services/api/client';
import type { PersonalizedNewsApiResponse, PersonalizedNewsArticle } from '@/types/personalizedNews';

const NEWSDATA_KEY = process.env.EXPO_PUBLIC_NEWSDATA_API_KEY || 'pub_9e7bb436a7524404b5df16308d32a85f';
const WEBZ_TOKEN =
  process.env.EXPO_PUBLIC_WEBZ_API_TOKEN || '5ced597a-49af-4ada-9634-776cd15a346e';
const WEBZ_API_BASE = 'https://api.webz.io';

/** Primary provider for the News Feed. NewsData.io remains a fallback. */
const NEWS_PROVIDER: 'webz' | 'newsdata' = 'webz';

/**
 * Only these emergency categories are allowed in the News Feed.
 * Anything else is filtered out.
 */
export const SUPPORTED_NEWS_CATEGORIES = [
  'Wildfire',
  'Earthquake',
  'Thunderstorm',
  'Flood Warning',
  'Hurricane',
  'Tornado',
  'Weather',
  'Disaster',
  'Road Closure',
  'Traffic Incident',
] as const;

/**
 * Phrase patterns for allowed rescue / emergency news only.
 */
const CATEGORY_MATCH_PATTERNS: RegExp[] = [
  // Wildfire / fire
  /\bwildfire\b/i,
  /\bwild\s*fire\b/i,
  /\bbrush\s*fire\b/i,
  /\bforest\s*fire\b/i,
  /\bgrass\s*fire\b/i,
  /\bred\s*flag\s*warning\b/i,
  /\bfire\s*weather\b/i,
  /\bfire\s*evacuation\b/i,

  // Earthquake
  /\bearthquake\b/i,
  /\baftershock\b/i,
  /\bseismic\b/i,

  // Thunderstorm
  /\bthunderstorm\b/i,
  /\bthunder\s*storm\b/i,
  /\bsevere\s*thunderstorm\b/i,

  // Flood
  /\bflood\s*warning\b/i,
  /\bflood\s*watch\b/i,
  /\bflood\s*advisory\b/i,
  /\bflash\s*flood\b/i,
  /\bflooding\b/i,
  /\bflood\b/i,

  // Hurricane / tropical
  /\bhurricane\b/i,
  /\btropical\s*storm\b/i,
  /\btropical\s*cyclone\b/i,

  // Tornado
  /\btornado\b/i,

  // Weather / disaster (must be clear emergency context)
  /\bweather\s*(alert|warning|emergency|advisory|watch)\b/i,
  /\bsevere\s*weather\b/i,
  /\bnational\s*weather\s*service\b/i,
  /\bnatural\s*disaster\b/i,
  /\bdisaster\s*(declaration|emergency|area|relief|response|zone)\b/i,
  /\bstate\s*of\s*emergency\b/i,
  /\bemergency\s*declaration\b/i,

  // Road closure / traffic incident
  /\broad\s*closures?\b/i,
  /\broads?\s*closed\b/i,
  /\bhighway\s*closures?\b/i,
  /\bhighway\s*closed\b/i,
  /\binterstate\s*closed\b/i,
  /\bfreeway\s*closed\b/i,
  /\bbridge\s*closed\b/i,
  /\btraffic\s*(incident|accident|crash|collision)\b/i,
  /\bmulti[- ]vehicle\s*(crash|accident|collision)\b/i,
  /\bclosed\s+(due\s+to|because\s+of|from)\s+(flood|fire|storm|wind|snow|ice|debris|weather|crash|accident)\b/i,
];

/** NewsData.io / Webz category labels that never belong in this feed. */
const FORBIDDEN_API_CATEGORIES = new Set([
  'sports',
  'sport',
  'entertainment',
  'politics',
  'business',
  'lifestyle',
  'tourism',
  'food',
]);

/**
 * Hard reject if these appear — unrelated local, sports, politics, lifestyle.
 * (Checked before category allow-list.)
 */
const FORBIDDEN_CONTENT_PATTERNS: RegExp[] = [
  /\b(movie|cinema|actor|actress|celebrity|celebs?|box office|netflix|hollywood|grammy|oscar|concert|album|song)\b/i,
  /\b(nfl|nba|mlb|nhl|nascar|fifa|uefa|olympics?|playoffs?|championship|touchdown|quarterback|stadium)\b/i,
  /\b(pro football|hall of fame|super bowl|world series|march madness)\b/i,
  /\b(football|basketball|baseball|soccer|tennis|golf) (game|match|team|player|coach|score)\b/i,
  /\b(election|campaign trail|democrat|republican|congressman|senator|governor race)\b/i,
  /\b(stock market|wall street|nasdaq|crypto|bitcoin|investor|ipo)\b/i,
  /\b(recipe|restaurant review|fashion week|dating app|horoscope)\b/i,
  /\b(giveaway|free food|food bank|chicken giveaway)\b/i,
  /\b(murder trial|celebrity gossip|box office)\b/i,
  /\b(op[- ]?ed|editorial:|column:)\b/i,
];

const STATE_LOCALITIES: Record<string, string[]> = {
  AL: ['alabama', 'birmingham', 'montgomery', 'mobile', 'huntsville'],
  AK: ['alaska', 'anchorage', 'fairbanks', 'juneau'],
  AZ: ['arizona', 'phoenix', 'tucson', 'mesa', 'chandler', 'scottsdale', 'tempe', 'maricopa', 'flagstaff', 'yuma'],
  AR: ['arkansas', 'little rock', 'fayetteville', 'fort smith'],
  CA: ['california', 'los angeles', 'san francisco', 'san diego', 'sacramento', 'san jose', 'fresno', 'oakland', 'bakersfield', 'riverside', 'san bernardino', 'orange county'],
  CO: ['colorado', 'denver', 'colorado springs', 'aurora', 'boulder', 'fort collins'],
  CT: ['connecticut', 'hartford', 'new haven', 'stamford'],
  DE: ['delaware', 'wilmington', 'dover'],
  FL: ['florida', 'miami', 'orlando', 'tampa', 'jacksonville', 'tallahassee', 'fort lauderdale', 'sarasota'],
  GA: ['georgia', 'atlanta', 'savannah', 'augusta', 'columbus'],
  HI: ['hawaii', 'honolulu', 'maui', 'oahu', 'hilo'],
  ID: ['idaho', 'boise', 'idaho falls', 'nampa'],
  IL: ['illinois', 'chicago', 'springfield', 'naperville'],
  IN: ['indiana', 'indianapolis', 'fort wayne', 'evansville'],
  IA: ['iowa', 'des moines', 'cedar rapids', 'davenport'],
  KS: ['kansas', 'wichita', 'topeka', 'overland park'],
  KY: ['kentucky', 'louisville', 'lexington', 'frankfort'],
  LA: ['louisiana', 'new orleans', 'baton rouge', 'shreveport'],
  ME: ['maine', 'portland', 'augusta', 'bangor'],
  MD: ['maryland', 'baltimore', 'annapolis', 'frederick'],
  MA: ['massachusetts', 'boston', 'worcester', 'springfield'],
  MI: ['michigan', 'detroit', 'grand rapids', 'ann arbor', 'lansing'],
  MN: ['minnesota', 'minneapolis', 'st. paul', 'duluth'],
  MS: ['mississippi', 'jackson', 'gulfport', 'biloxi'],
  MO: ['missouri', 'kansas city', 'st. louis', 'springfield'],
  MT: ['montana', 'billings', 'missoula', 'bozeman', 'helena'],
  NE: ['nebraska', 'omaha', 'lincoln'],
  NV: ['nevada', 'las vegas', 'reno', 'henderson'],
  NH: ['new hampshire', 'manchester', 'nashua', 'concord'],
  NJ: ['new jersey', 'newark', 'jersey city', 'trenton'],
  NM: ['new mexico', 'albuquerque', 'santa fe', 'las cruces'],
  NY: ['new york', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'albany', 'buffalo', 'rochester', 'syracuse', 'long island'],
  NC: ['north carolina', 'charlotte', 'raleigh', 'greensboro', 'durham', 'asheville'],
  ND: ['north dakota', 'fargo', 'bismarck'],
  OH: ['ohio', 'columbus', 'cleveland', 'cincinnati', 'toledo'],
  OK: ['oklahoma', 'oklahoma city', 'tulsa', 'norman'],
  OR: ['oregon', 'portland', 'eugene', 'salem', 'bend'],
  PA: ['pennsylvania', 'philadelphia', 'pittsburgh', 'harrisburg'],
  RI: ['rhode island', 'providence', 'warwick'],
  SC: ['south carolina', 'charleston', 'columbia', 'greenville'],
  SD: ['south dakota', 'sioux falls', 'rapid city'],
  TN: ['tennessee', 'nashville', 'memphis', 'knoxville', 'chattanooga'],
  TX: ['texas', 'houston', 'dallas', 'austin', 'san antonio', 'fort worth', 'el paso', 'corpus christi', 'lubbock'],
  UT: ['utah', 'salt lake city', 'provo', 'ogden'],
  VT: ['vermont', 'burlington', 'montpelier'],
  VA: ['virginia', 'richmond', 'virginia beach', 'norfolk', 'roanoke'],
  WA: ['seattle', 'spokane', 'tacoma', 'bellevue', 'olympia', 'washington state'],
  WV: ['west virginia', 'charleston', 'huntington', 'morgantown'],
  WI: ['wisconsin', 'milwaukee', 'madison', 'green bay'],
  WY: ['wyoming', 'cheyenne', 'casper', 'jackson'],
  DC: ['district of columbia', 'washington dc', 'washington, d.c.', 'washington d.c.'],
};

function resolveStateCode(rawState: string, mappedName: string): string | null {
  const upper = rawState.trim().toUpperCase();
  if (US_STATE_NAMES[upper]) return upper;

  const byName = Object.entries(US_STATE_NAMES).find(
    ([, name]) => name.toLowerCase() === mappedName.trim().toLowerCase(),
  );
  return byName?.[0] ?? null;
}

function normalizeTitleKey(title?: string | null): string {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesAllowedCategory(text: string): boolean {
  return CATEGORY_MATCH_PATTERNS.some((pattern) => pattern.test(text));
}

function hasForbiddenContent(text: string): boolean {
  return FORBIDDEN_CONTENT_PATTERNS.some((pattern) => pattern.test(text));
}

function hasForbiddenApiCategory(categories?: string[] | null): boolean {
  if (!categories?.length) return false;
  return categories.some((c) => FORBIDDEN_API_CATEGORIES.has(String(c).toLowerCase()));
}

function isStateRelevant(
  text: string,
  targetStateName: string,
  targetStateCode: string | null,
): boolean {
  const targetName = targetStateName.trim().toLowerCase();
  const code = (targetStateCode || '').toUpperCase();
  const localities = code ? STATE_LOCALITIES[code] || [targetName] : [targetName];

  // Washington state: avoid matching "Washington, D.C." as WA
  if (code === 'WA') {
    const dcOnly =
      /\bwashington\s*,?\s*d\.?c\.?\b/i.test(text) &&
      !/\bwashington state\b/i.test(text) &&
      !localities.some((loc) => loc !== 'washington state' && text.includes(loc));
    if (dcOnly) return false;
  }

  const mentionsTarget =
    text.includes(targetName) ||
    localities.some((loc) => text.includes(loc)) ||
    (code.length === 2 &&
      code !== 'WA' && // bare "WA" / "Washington" is ambiguous; rely on localities + "washington state"
      new RegExp(`(^|[^a-z])${code.toLowerCase()}([^a-z]|$)`).test(text)) ||
    (code === 'WA' &&
      (/\bwashington state\b/i.test(text) ||
        localities.some((loc) => text.includes(loc))));

  if (!mentionsTarget) return false;

  for (const [otherCode, otherName] of Object.entries(US_STATE_NAMES)) {
    if (otherCode === code) continue;
    const otherLower = otherName.toLowerCase();
    if (!text.includes(otherLower)) continue;

    const otherLocalities = STATE_LOCALITIES[otherCode] || [];
    const mentionsOtherLocality = otherLocalities.some(
      (loc) => loc !== otherLower && text.includes(loc),
    );
    const mentionsOurName = text.includes(targetName) || (code === 'WA' && /\bwashington state\b/i.test(text));
    if (mentionsOtherLocality && !mentionsOurName) {
      return false;
    }
  }

  return true;
}

/**
 * Strict gate for News Feed articles.
 * Must match an allowed emergency/weather category phrase AND (when set) the user state.
 */
export function isRelevantEmergencyArticle(
  article: Pick<PersonalizedNewsArticle, 'title' | 'description' | 'content' | 'category'>,
  targetStateName?: string | null,
  targetStateCode?: string | null,
): boolean {
  const title = (article.title || '').trim();
  if (!title) return false;

  const description = (article.description || '').trim();
  const titleLower = title.toLowerCase();
  const titleAndDesc = `${title} ${description}`.toLowerCase();

  if (hasForbiddenApiCategory(article.category)) return false;
  if (hasForbiddenContent(titleAndDesc)) return false;

  // Title must itself signal an allowed category — description-only matches are too noisy.
  if (!matchesAllowedCategory(titleLower)) {
    // Allow description match only for strong multi-word alert phrases already in title+desc,
    // and only when title also contains a weather/disaster cue word.
    const titleHasCue =
      /\b(warning|advisory|alert|storm|flood|fire|wildfire|tornado|hurricane|blizzard|earthquake|evacuat|outage|closure|closed|disaster|emergency|haboob|dust storm)\b/i.test(
        titleLower,
      ) ||
      /\b(flood|fire|storm|wind|heat|tornado|hurricane|blizzard|winter|marine|weather)\s+(watch|warning|advisory)\b/i.test(
        titleLower,
      );
    if (!titleHasCue || !matchesAllowedCategory(titleAndDesc)) {
      return false;
    }
  }

  if (targetStateName?.trim()) {
    return isStateRelevant(titleAndDesc, targetStateName, targetStateCode || null);
  }

  return true;
}

function filterAndDedupeArticles(
  articles: PersonalizedNewsArticle[],
  mappedName: string | null,
  stateCode: string | null,
): PersonalizedNewsArticle[] {
  const seenKeys = new Set<string>();
  const seenTitles = new Set<string>();
  const filtered: PersonalizedNewsArticle[] = [];

  for (const art of articles) {
    const linkKey = art.article_id || art.link;
    const titleKey = normalizeTitleKey(art.title);
    if (seenKeys.has(linkKey) || (titleKey && seenTitles.has(titleKey))) continue;

    if (!isRelevantEmergencyArticle(art, mappedName, stateCode)) continue;

    seenKeys.add(linkKey);
    if (titleKey) seenTitles.add(titleKey);
    filtered.push(art);
  }

  return filtered;
}

/**
 * NewsData.io rejects `q` values over 100 characters (UnsupportedQueryLength) and
 * rejects quoted phrases used inside boolean expressions (MalformedQuery), so queries
 * must stay short and unquoted. Precision is recovered by isRelevantEmergencyArticle.
 */
const NEWSDATA_MAX_QUERY_LENGTH = 100;

const KEYWORD_GROUPS = [
  '(wildfire OR earthquake OR thunderstorm OR tornado OR hurricane)',
  '(flood OR flooding OR "flood warning" OR "flash flood")',
  '("road closure" OR "traffic incident" OR disaster OR "severe weather")',
];

const NATIONAL_QUERIES = [
  'wildfire OR earthquake OR thunderstorm OR tornado OR hurricane OR flood',
  'disaster OR "road closure" OR "traffic incident" OR "severe weather"',
];

/**
 * NewsData.io bills one API credit per request and the plan has a small daily
 * allowance, so a feed load spends at most this many and reuses a short-lived cache.
 */
const MAX_REQUESTS_PER_LOAD = 3;
const ENOUGH_ARTICLES = 8;
const NEWS_CACHE_TTL_MS = 15 * 60 * 1000;

const newsCache = new Map<string, { cachedAt: number; response: PersonalizedNewsApiResponse }>();

export function clearPersonalizedNewsCache(): void {
  newsCache.clear();
}

function readCache(key: string): PersonalizedNewsApiResponse | null {
  const hit = newsCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.cachedAt > NEWS_CACHE_TTL_MS) {
    newsCache.delete(key);
    return null;
  }
  return hit.response;
}

function buildNewsDataQueries(stateName: string | null): string[] {
  const queries = stateName
    ? KEYWORD_GROUPS.map((group) => `${stateName} AND ${group}`)
    : NATIONAL_QUERIES;

  const withinLimit = queries.filter((q) => q.length <= NEWSDATA_MAX_QUERY_LENGTH);
  return withinLimit.length ? withinLimit : NATIONAL_QUERIES;
}

function getFallbackMockArticles(): PersonalizedNewsArticle[] {
  return MOCK_BLUE_SKY_NEWS.map((item) => ({
    article_id: item.id,
    title: item.title,
    link: item.url || '',
    description: item.body,
    content: item.body,
    pubDate: item.timestamp,
    image_url: item.imageUrl || null,
    source_id: 'ready2go',
    source_name: item.publisher || 'Ready2Go Emergency Response',
    source_icon: null,
    category: [item.category || 'EMERGENCY'],
    country: ['US'],
  }));
}

/**
 * Webz.io query — state + only rescue-relevant categories.
 */
function buildWebzQuery(stateName: string | null, stateCode: string | null): string {
  const base =
    'country:"US" AND language:"english" ' +
    'AND (sentiment:"negative" OR sentiment:"positive" OR sentiment:"neutral")';
  const topics =
    '("wildfire" OR "earthquake" OR "thunderstorm" OR "flood warning" OR "flash flood" OR "hurricane" OR "tornado" OR "weather warning" OR "severe weather" OR "disaster" OR "road closure" OR "traffic incident")';

  if (stateName && stateCode) {
    return `${base} AND ("${stateName}" OR "${stateCode}") AND ${topics}`;
  }
  if (stateName) {
    return `${base} AND "${stateName}" AND ${topics}`;
  }
  return `${base} AND ${topics}`;
}

/**
 * Clean noisy Webz site titles / summaries for card UI.
 */
function cleanSourceName(site?: string | null, siteTitle?: string | null): string {
  const domain = String(site || '')
    .replace(/^www\./i, '')
    .trim();
  if (domain) {
    return domain.length <= 40 ? domain : domain.slice(0, 37) + '...';
  }

  const title = String(siteTitle || '')
    .split('|')[0]
    .split(' - ')[0]
    .replace(/\s+/g, ' ')
    .trim();
  if (!title) return 'News';
  return title.length <= 40 ? title : title.slice(0, 37) + '...';
}

function cleanSnippet(raw?: string | null): string | null {
  if (!raw) return null;
  let text = String(raw)
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  text = text
    .replace(/\b(Facebook|Twitter|Bluesky|WhatsApp|SMS|Email|Print|Copy article|Share)\b/gi, ' ')
    .replace(/\|{2,}/g, ' ')
    .replace(/\|\s*\|/g, ' ')
    .replace(/\s*\|\s*/g, ' · ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!text || text.length < 20) return null;
  if (text.length > 180) text = `${text.slice(0, 177).trim()}...`;
  return text;
}

/**
 * Webz gate: title must match an allowed rescue category, state must match,
 * and sports/politics junk is dropped.
 */
function isAcceptableWebzArticle(
  article: Pick<PersonalizedNewsArticle, 'title' | 'description' | 'content' | 'category'>,
  targetStateName?: string | null,
  targetStateCode?: string | null,
): boolean {
  const title = (article.title || '').trim();
  if (!title) return false;

  const description = (article.description || '').trim();
  const titleLower = title.toLowerCase();
  const titleAndDesc = `${title} ${description}`.toLowerCase();
  const fullBlob = `${titleAndDesc} ${article.content || ''}`.toLowerCase();

  if (hasForbiddenApiCategory(article.category)) return false;
  if (hasForbiddenContent(fullBlob)) return false;

  // Title must clearly match an allowed category (not buried only in body).
  if (!matchesAllowedCategory(titleLower)) {
    const titleHasCue =
      /\b(wildfire|earthquake|thunderstorm|flood|hurricane|tornado|disaster|weather|road|highway|traffic|closure|closed|warning|watch|advisory|alert|crash|accident)\b/i.test(
        titleLower,
      );
    if (!titleHasCue || !matchesAllowedCategory(titleAndDesc)) {
      return false;
    }
  }

  if (targetStateName?.trim()) {
    return isStateRelevant(fullBlob, targetStateName, targetStateCode || null);
  }

  return true;
}

function mapNewsDataArticle(art: any): PersonalizedNewsArticle {
  return {
    article_id: art.article_id,
    title: art.title,
    link: art.link,
    description: art.description || null,
    content: art.content || null,
    pubDate: art.pubDate,
    image_url: art.image_url || null,
    source_id: art.source_id,
    source_name: art.source_name || art.source_id,
    source_icon: art.source_icon || null,
    category: art.category || [],
    country: art.country || [],
  };
}

function pickWebzImage(post: any): string | null {
  const threadImage = post?.thread?.main_image;
  if (typeof threadImage === 'string' && threadImage.trim()) return threadImage.trim();

  const external = Array.isArray(post?.external_images) ? post.external_images : [];
  const internal = Array.isArray(post?.internal_images) ? post.internal_images : [];
  const first = [...external, ...internal].find(
    (img) => typeof img === 'string' && img.trim().length > 0,
  );
  return first?.trim() || null;
}

function mapWebzArticle(post: any): PersonalizedNewsArticle {
  const text = typeof post?.text === 'string' ? post.text : '';
  const rawSummary =
    (typeof post?.summary === 'string' && post.summary.trim()) ||
    text.slice(0, 400).trim() ||
    null;

  const site = String(post?.thread?.site || post?.thread?.site_full || '').trim();
  const siteTitle = String(post?.thread?.site_title || '').trim();

  return {
    article_id: String(post?.uuid || post?.thread?.uuid || post?.url || ''),
    title: String(post?.title || post?.thread?.title || '').trim(),
    link: String(post?.url || post?.thread?.url || ''),
    description: cleanSnippet(rawSummary),
    content: text || null,
    pubDate: String(post?.published || post?.thread?.published || ''),
    image_url: pickWebzImage(post),
    source_id: site || 'webz',
    source_name: cleanSourceName(site, siteTitle),
    source_icon: null,
    category: Array.isArray(post?.categories)
      ? post.categories.map((c: unknown) => String(c))
      : [],
    country: post?.thread?.country ? [String(post.thread.country)] : ['US'],
  };
}

function collectWebzArticles(
  rawArticles: PersonalizedNewsArticle[],
  stateFilterName: string | null,
  stateCode: string | null,
  existing?: PersonalizedNewsArticle[],
): PersonalizedNewsArticle[] {
  const seenLinks = new Set((existing || []).map((a) => a.article_id || a.link));
  const seenTitles = new Set(
    (existing || []).map((a) => normalizeTitleKey(a.title)).filter(Boolean),
  );
  const out: PersonalizedNewsArticle[] = [...(existing || [])];

  for (const candidate of rawArticles) {
    const key = candidate.article_id || candidate.link;
    const titleKey = normalizeTitleKey(candidate.title);
    if (!key || seenLinks.has(key) || (titleKey && seenTitles.has(titleKey))) continue;
    if (!isAcceptableWebzArticle(candidate, stateFilterName, stateCode)) continue;

    seenLinks.add(key);
    if (titleKey) seenTitles.add(titleKey);
    out.push(candidate);
  }

  return out;
}

function collectFilteredArticles(
  rawArticles: PersonalizedNewsArticle[],
  stateFilterName: string | null,
  stateCode: string | null,
  existing?: PersonalizedNewsArticle[],
): PersonalizedNewsArticle[] {
  const seenLinks = new Set((existing || []).map((a) => a.article_id || a.link));
  const seenTitles = new Set(
    (existing || []).map((a) => normalizeTitleKey(a.title)).filter(Boolean),
  );
  const out: PersonalizedNewsArticle[] = [...(existing || [])];

  for (const candidate of rawArticles) {
    const key = candidate.article_id || candidate.link;
    const titleKey = normalizeTitleKey(candidate.title);
    if (!key || seenLinks.has(key) || (titleKey && seenTitles.has(titleKey))) continue;
    if (!isRelevantEmergencyArticle(candidate, stateFilterName, stateCode)) continue;

    seenLinks.add(key);
    if (titleKey) seenTitles.add(titleKey);
    out.push(candidate);
  }

  return out;
}

async function fetchFromWebz(
  page: string | null | undefined,
  stateFilterName: string | null,
  stateCode: string | null,
): Promise<{ articles: PersonalizedNewsArticle[]; nextPage: string | null }> {
  const collected: PersonalizedNewsArticle[] = [];
  let nextPath: string | null = null;
  let pagesFetched = 0;
  // First load may need a second page after state/topic filtering.
  const maxPages = page?.startsWith('/api/news') ? 1 : 3;

  let requestUrl: string | null;
  if (page && page.startsWith('/api/news')) {
    requestUrl = `${WEBZ_API_BASE}${page}`;
  } else {
    const url = new URL(`${WEBZ_API_BASE}/api/news`);
    url.searchParams.set('token', WEBZ_TOKEN);
    url.searchParams.set('sort', 'published');
    url.searchParams.set('order', 'desc');
    url.searchParams.set('format', 'json');
    url.searchParams.set('size', '20');
    url.searchParams.set('webz_reporter', 'true');
    url.searchParams.set('includeSyndicated', 'false');
    url.searchParams.set('allowNewsHistory', 'false');
    url.searchParams.set('q', buildWebzQuery(stateFilterName, stateCode));
    requestUrl = url.toString();
  }

  while (requestUrl && pagesFetched < maxPages && collected.length < ENOUGH_ARTICLES) {
    const currentUrl: string = requestUrl;
    const res: Response = await fetch(currentUrl, {
      headers: { Accept: 'application/json' },
    });
    const data: any = await res.json().catch(() => null);
    pagesFetched++;

    if (!res.ok || !data) {
      const message =
        data?.detail || data?.message || data?.error || `Webz.io request failed (${res.status})`;
      throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }

    const posts = Array.isArray(data.posts) ? data.posts : [];
    const mapped = posts.map(mapWebzArticle);
    const merged = collectWebzArticles(mapped, stateFilterName, stateCode, collected);
    collected.length = 0;
    collected.push(...merged);

    nextPath =
      typeof data.next === 'string' && data.next.startsWith('/api/news') ? data.next : null;
    const hasMore: boolean = Boolean(data.more_results_available) && Boolean(nextPath);
    requestUrl =
      hasMore && collected.length < ENOUGH_ARTICLES && nextPath
        ? `${WEBZ_API_BASE}${nextPath}`
        : null;
  }

  return {
    articles: collected,
    nextPage: nextPath,
  };
}

async function fetchFromNewsData(
  page: string | null | undefined,
  mappedName: string | null,
  stateFilterName: string | null,
  stateCode: string | null,
): Promise<{ articles: PersonalizedNewsArticle[]; nextPage: string | null }> {
  const searchQueries = buildNewsDataQueries(mappedName);
  const collectedArticles: PersonalizedNewsArticle[] = [];
  let nextPageCursor: string | null = null;
  let queryIndex = 0;
  let succeededQueries = 0;
  let lastQueryError: string | null = null;
  let limitReached = false;
  const maxRequests = Math.min(searchQueries.length, MAX_REQUESTS_PER_LOAD);

  while (collectedArticles.length < ENOUGH_ARTICLES && queryIndex < maxRequests) {
    const newsDataUrl = new URL('https://newsdata.io/api/1/latest');
    newsDataUrl.searchParams.set('apikey', NEWSDATA_KEY);
    newsDataUrl.searchParams.set('country', 'us');
    newsDataUrl.searchParams.set('language', 'en');
    newsDataUrl.searchParams.set('q', searchQueries[queryIndex]);

    if (page && queryIndex === 0 && !page.startsWith('/api/news')) {
      newsDataUrl.searchParams.set('page', page);
    }

    const res = await fetch(newsDataUrl.toString());
    queryIndex++;

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.status === 'error') {
      lastQueryError =
        data?.results?.message || data?.message || `NewsData request failed (${res.status})`;
      if (res.status === 429) {
        limitReached = true;
        break;
      }
      continue;
    }

    succeededQueries++;
    if (!Array.isArray(data.results)) continue;

    nextPageCursor = data.nextPage || nextPageCursor;

    const mapped = data.results.map(mapNewsDataArticle);
    const merged = collectFilteredArticles(
      mapped,
      stateFilterName,
      stateCode,
      collectedArticles,
    );
    collectedArticles.length = 0;
    collectedArticles.push(...merged);
  }

  if (succeededQueries === 0) {
    throw new Error(
      limitReached
        ? 'Daily news limit reached. New articles will be available again tomorrow.'
        : lastQueryError || 'Failed to fetch news feed',
    );
  }

  return { articles: collectedArticles, nextPage: nextPageCursor };
}

/**
 * Fetch disaster/weather/emergency news for the News Feed.
 * Primary: Webz.io (state-scoped). Fallback: NewsData.io.
 * Every article is validated against the allowed category list.
 */
export async function fetchPersonalizedNews(
  token: string,
  page?: string | null,
  userState?: string | null,
  options: { forceRefresh?: boolean } = {},
): Promise<PersonalizedNewsApiResponse> {
  const queryParams = new URLSearchParams();
  if (page) queryParams.set('page', page);
  if (userState?.trim()) queryParams.set('userState', userState.trim());

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const cacheKey = `${(userState || '').trim().toUpperCase()}|${page || ''}`;
  if (!options.forceRefresh) {
    const cached = readCache(cacheKey);
    if (cached) return cached;
  }

  const rawState = userState?.trim() || '';
  const mappedName = rawState ? resolveStateLabel(rawState, rawState) : null;
  const isPersonalized = Boolean(mappedName && mappedName !== 'United States');
  const stateCode = isPersonalized && mappedName ? resolveStateCode(rawState, mappedName) : null;
  const stateFilterName = isPersonalized ? mappedName : null;

  const buildResponse = (
    articles: PersonalizedNewsArticle[],
    nextPage: string | null,
  ): PersonalizedNewsApiResponse => ({
    success: true,
    isPersonalized,
    userStateCode: rawState || null,
    mappedStateName: stateFilterName,
    totalResults: articles.length,
    nextPage,
    results: articles,
  });

  // Backend only when not using Webz as primary (backend currently 404s).
  if (NEWS_PROVIDER !== 'webz') {
    try {
      const backend = await apiRequest<PersonalizedNewsApiResponse>(`/news/personalized${qs}`, {
        token,
      });
      const results = filterAndDedupeArticles(backend.results || [], stateFilterName, stateCode);
      if (results.length > 0) {
        return {
          ...backend,
          isPersonalized: backend.isPersonalized ?? isPersonalized,
          userStateCode: backend.userStateCode ?? (rawState || null),
          mappedStateName: backend.mappedStateName ?? stateFilterName,
          totalResults: results.length,
          results,
        };
      }
    } catch (err: any) {
      if (err?.status && err.status !== 404) {
        throw err;
      }
    }
  }

  // Webz.io primary — state already in query; show results after light junk filter.
  if (NEWS_PROVIDER === 'webz' || page?.startsWith('/api/news')) {
    try {
      let webz = await fetchFromWebz(page, stateFilterName, stateCode);
      if (webz.articles.length === 0 && isPersonalized && !page) {
        webz = await fetchFromWebz(null, null, null);
      }
      const response = buildResponse(webz.articles, webz.nextPage);
      if (webz.articles.length > 0) {
        newsCache.set(cacheKey, { cachedAt: Date.now(), response });
        return response;
      }
      if (webz.articles.length > 0 || page?.startsWith('/api/news')) {
        return response;
      }
    } catch (webzErr: any) {
      if (page?.startsWith('/api/news')) {
        throw new Error(webzErr?.message || 'Failed to fetch news feed');
      }
      // Fall through to NewsData.
    }
  }

  // NewsData.io fallback
  try {
    const newsData = await fetchFromNewsData(page, stateFilterName, stateFilterName, stateCode);
    const response = buildResponse(newsData.articles, newsData.nextPage);
    if (newsData.articles.length > 0) {
      newsCache.set(cacheKey, { cachedAt: Date.now(), response });
      return response;
    }
  } catch {
    // Fall through to ultimate mock fallback
  }

  const fallbackArticles = getFallbackMockArticles();
  const fallbackResponse = buildResponse(fallbackArticles, null);
  newsCache.set(cacheKey, { cachedAt: Date.now(), response: fallbackResponse });
  return fallbackResponse;
}
