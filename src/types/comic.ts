export interface Publisher {
  id: number;
  name: string;
  createdAt: string;
}

export interface Series {
  id: number;
  name: string;
  publisherId: number;
  totalIssues: number;
  locgLink?: string;
  locgIssueCount?: number;
  lastCrawled?: string;
  startDate?: string;
  endDate?: string;
  run?: string;
  createdAt: string;
  // Joined data
  publisherName?: string;
}

export interface Issue {
  id: number;
  name: string;
  seriesId: number;
  issueNo: number;
  publisherId: number;
  variantDescription?: string;
  coverUrl?: string;
  releaseDate?: string;
  upc?: string;
  locgLink?: string;
  plot?: string;
  createdAt: string;
  // Joined data
  seriesName?: string;
  publisherName?: string;
}

export interface WishlistItem {
  id: number;
  name: string;
  seriesId: number;
  issueNo: number;
  publisherId: number;
  variantDescription?: string;
  coverUrl?: string;
  releaseDate?: string;
  upc?: string;
  locgLink?: string;
  plot?: string;
  createdAt: string;
  // Joined data
  seriesName?: string;
  publisherName?: string;
}

// Legacy interfaces for backward compatibility
export interface ComicSeries extends Series {
  title: string;
  issueCount: number;
  publisher?: string;
}

export interface ComicIssue extends Issue {
  issueNumber: string;
  title?: string;
}

export interface ComicWithIssues extends ComicSeries {
  issues: ComicIssue[];
  missingIssues: number[];
}