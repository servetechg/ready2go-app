/**
 * Interface representing a single personalized news article returned from the backend.
 */
export interface PersonalizedNewsArticle {
  article_id: string;
  title: string;
  link: string;
  description: string | null;
  content: string | null;
  pubDate: string;
  image_url: string | null;
  source_id: string;
  source_name: string;
  source_icon: string | null;
  category: string[];
  country: string[];
}

/**
 * Interface representing the API response from GET /api/news/personalized.
 */
export interface PersonalizedNewsApiResponse {
  success: true;
  isPersonalized: boolean;
  userStateCode: string | null;
  mappedStateName: string | null;
  totalResults: number;
  nextPage: string | null;
  results: PersonalizedNewsArticle[];
}

/**
 * Interface representing API error response payload.
 */
export interface PersonalizedNewsApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Props for the PersonalizedNewsFeed React Native UI component.
 */
export interface PersonalizedNewsFeedProps {
  /** Optional custom title override for the feed section header */
  title?: string;
  /** Optional callback triggered when an article card is tapped */
  onArticlePress?: (article: PersonalizedNewsArticle) => void;
  /** Whether the feed manages its own ScrollView/FlatList (default: true). Set false if inside parent ScrollView. */
  scrollable?: boolean;
  /** Optional container style overrides */
  style?: object;
  /** Max articles to render (e.g. 3 on Home). Omit for full feed. */
  maxItems?: number;
  /** Show article images (default true). Home preview hides them. */
  showImages?: boolean;
  /** Show section title + View all row (Home). */
  showSectionHeader?: boolean;
  /** Called when View all is tapped. */
  onViewAll?: () => void;
}

/**
 * Interface representing the return value of the usePersonalizedNews hook.
 */
export interface UsePersonalizedNewsResult {
  articles: PersonalizedNewsArticle[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  isPersonalized: boolean;
  userStateCode: string | null;
  mappedStateName: string | null;
  hasMore: boolean;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
}
