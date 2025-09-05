import { initializeDatabase } from './database';
import { Publisher, Series, Issue, WishlistItem, ComicSeries, ComicIssue, ComicWithIssues } from '@/types/comic';

const db = initializeDatabase();

export class PublisherService {
  static getAll(): Publisher[] {
    const stmt = db.prepare('SELECT * FROM publishers ORDER BY name');
    return stmt.all().map((row: any) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));
  }

  static getById(id: number): Publisher | null {
    const stmt = db.prepare('SELECT * FROM publishers WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    } : null;
  }

  static create(name: string): Publisher {
    const stmt = db.prepare('INSERT INTO publishers (name) VALUES (?)');
    const result = stmt.run(name);
    const newPublisher = db.prepare('SELECT * FROM publishers WHERE id = ?').get(result.lastInsertRowid) as any;
    return {
      id: newPublisher.id,
      name: newPublisher.name,
      createdAt: newPublisher.created_at,
    };
  }

  static findOrCreate(name: string): Publisher {
    const existing = db.prepare('SELECT * FROM publishers WHERE name = ?').get(name) as any;
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        createdAt: existing.created_at,
      };
    }
    return this.create(name);
  }
}

export class SeriesService {
  static getAll(): Series[] {
    const stmt = db.prepare(`
      SELECT s.*, p.name as publisher_name 
      FROM series s 
      JOIN publishers p ON s.publisher_id = p.id 
      ORDER BY s.name
    `);
    return stmt.all().map((row: any) => ({
      id: row.id,
      name: row.name,
      publisherId: row.publisher_id,
      totalIssues: row.total_issues,
      locgLink: row.locg_link,
      locgIssueCount: row.locg_issue_count,
      lastCrawled: row.last_crawled,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      publisherName: row.publisher_name,
    }));
  }

  static getById(id: number): Series | null {
    const stmt = db.prepare(`
      SELECT s.*, p.name as publisher_name 
      FROM series s 
      JOIN publishers p ON s.publisher_id = p.id 
      WHERE s.id = ?
    `);
    const row = stmt.get(id) as any;
    return row ? {
      id: row.id,
      name: row.name,
      publisherId: row.publisher_id,
      totalIssues: row.total_issues,
      locgLink: row.locg_link,
      locgIssueCount: row.locg_issue_count,
      lastCrawled: row.last_crawled,
      startDate: row.start_date,
      endDate: row.end_date,
      run: row.run,
      createdAt: row.created_at,
      publisherName: row.publisher_name,
    } : null;
  }

  static create(series: Omit<Series, 'id' | 'createdAt' | 'publisherName'>): Series {
    const stmt = db.prepare(`
      INSERT INTO series (name, publisher_id, total_issues, locg_link, start_date, end_date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(series.name, series.publisherId, series.totalIssues, series.locgLink, series.startDate, series.endDate);
    const newSeries = this.getById(result.lastInsertRowid as number);
    return newSeries!;
  }

  static update(id: number, updates: Partial<Omit<Series, 'id' | 'createdAt' | 'publisherName'>>): Series | null {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.publisherId !== undefined) {
      fields.push('publisher_id = ?');
      values.push(updates.publisherId);
    }
    if (updates.totalIssues !== undefined) {
      fields.push('total_issues = ?');
      values.push(updates.totalIssues);
    }
    if (updates.locgLink !== undefined) {
      fields.push('locg_link = ?');
      values.push(updates.locgLink);
    }
    if (updates.startDate !== undefined) {
      fields.push('start_date = ?');
      values.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      fields.push('end_date = ?');
      values.push(updates.endDate);
    }

    if (fields.length === 0) {
      return existing; // No updates to apply
    }

    values.push(id); // Add ID for WHERE clause
    const stmt = db.prepare(`UPDATE series SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return this.getById(id);
  }

  static findOrCreate(name: string, publisherId: number, locgLink?: string): Series {
    const existing = db.prepare('SELECT * FROM series WHERE name = ? AND publisher_id = ?').get(name, publisherId) as any;
    if (existing) {
      const stmt = db.prepare(`
        SELECT s.*, p.name as publisher_name 
        FROM series s 
        JOIN publishers p ON s.publisher_id = p.id 
        WHERE s.id = ?
      `);
      const row = stmt.get(existing.id) as any;
      return {
        id: row.id,
        name: row.name,
        publisherId: row.publisher_id,
        totalIssues: row.total_issues,
        locgLink: row.locg_link,
        createdAt: row.created_at,
        publisherName: row.publisher_name,
      };
    }
    return this.create({
      name,
      publisherId,
      totalIssues: 0,
      locgLink
    });
  }

  // Crawler-specific methods
  static updateLocgIssueCount(id: number, count: number, timestamp: string, run?: string): Series | null {
    const stmt = db.prepare(`
      UPDATE series SET locg_issue_count = ?, last_crawled = ?, run = ? WHERE id = ?
    `);
    stmt.run(count, timestamp, run || null, id);
    return this.getById(id);
  }

  static getSeriesWithLocgLinks(): Series[] {
    const stmt = db.prepare(`
      SELECT s.*, p.name as publisher_name 
      FROM series s 
      JOIN publishers p ON s.publisher_id = p.id 
      WHERE s.locg_link IS NOT NULL AND s.locg_link != ''
      ORDER BY s.name
    `);
    return stmt.all().map((row: any) => ({
      id: row.id,
      name: row.name,
      publisherId: row.publisher_id,
      totalIssues: row.total_issues,
      locgLink: row.locg_link,
      locgIssueCount: row.locg_issue_count,
      lastCrawled: row.last_crawled,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      publisherName: row.publisher_name,
    }));
  }

  static getSeriesNeedingCrawl(maxAge: number = 24 * 60 * 60 * 1000): Series[] {
    const cutoff = new Date(Date.now() - maxAge).toISOString();
    const stmt = db.prepare(`
      SELECT s.*, p.name as publisher_name 
      FROM series s 
      JOIN publishers p ON s.publisher_id = p.id 
      WHERE s.locg_link IS NOT NULL AND s.locg_link != ''
        AND (s.last_crawled IS NULL OR s.last_crawled < ?)
      ORDER BY s.name
    `);
    return stmt.all(cutoff).map((row: any) => ({
      id: row.id,
      name: row.name,
      publisherId: row.publisher_id,
      totalIssues: row.total_issues,
      locgLink: row.locg_link,
      locgIssueCount: row.locg_issue_count,
      lastCrawled: row.last_crawled,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      publisherName: row.publisher_name,
    }));
  }
}

export class IssueService {
  static getAll(): Issue[] {
    const stmt = db.prepare(`
      SELECT i.*, s.name as series_name, p.name as publisher_name 
      FROM issues i 
      JOIN series s ON i.series_id = s.id 
      JOIN publishers p ON i.publisher_id = p.id 
      ORDER BY s.name, i.issue_no
    `);
    return stmt.all().map((row: any) => ({
      id: row.id,
      name: row.name,
      seriesId: row.series_id,
      issueNo: row.issue_no,
      publisherId: row.publisher_id,
      variantDescription: row.variant_description,
      coverUrl: row.cover_url,
      releaseDate: row.release_date,
      upc: row.upc,
      locgLink: row.locg_link,
      plot: row.plot,
      createdAt: row.created_at,
      seriesName: row.series_name,
      publisherName: row.publisher_name,
    }));
  }

  static getById(id: number): Issue | null {
    const stmt = db.prepare(`
      SELECT i.*, s.name as series_name, p.name as publisher_name 
      FROM issues i 
      JOIN series s ON i.series_id = s.id 
      JOIN publishers p ON i.publisher_id = p.id 
      WHERE i.id = ?
    `);
    const row = stmt.get(id) as any;
    return row ? {
      id: row.id,
      name: row.name,
      seriesId: row.series_id,
      issueNo: row.issue_no,
      publisherId: row.publisher_id,
      variantDescription: row.variant_description,
      coverUrl: row.cover_url,
      releaseDate: row.release_date,
      upc: row.upc,
      locgLink: row.locg_link,
      plot: row.plot,
      createdAt: row.created_at,
      seriesName: row.series_name,
      publisherName: row.publisher_name,
    } : null;
  }

  static create(issue: Omit<Issue, 'id' | 'createdAt' | 'seriesName' | 'publisherName'>): Issue {
    const stmt = db.prepare(`
      INSERT INTO issues (name, series_id, issue_no, publisher_id, variant_description, cover_url, release_date, upc, locg_link, plot) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      issue.name,
      issue.seriesId,
      issue.issueNo,
      issue.publisherId,
      issue.variantDescription,
      issue.coverUrl,
      issue.releaseDate,
      issue.upc,
      issue.locgLink,
      issue.plot
    );
    const newIssue = this.getById(result.lastInsertRowid as number);
    return newIssue!;
  }

  static update(id: number, updates: Partial<Omit<Issue, 'id' | 'createdAt' | 'seriesName' | 'publisherName'>>): Issue | null {
    const existingIssue = this.getById(id);
    if (!existingIssue) {
      return null;
    }

    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.seriesId !== undefined) {
      fields.push('series_id = ?');
      values.push(updates.seriesId);
    }
    if (updates.issueNo !== undefined) {
      fields.push('issue_no = ?');
      values.push(updates.issueNo);
    }
    if (updates.publisherId !== undefined) {
      fields.push('publisher_id = ?');
      values.push(updates.publisherId);
    }
    if (updates.variantDescription !== undefined) {
      fields.push('variant_description = ?');
      values.push(updates.variantDescription);
    }
    if (updates.coverUrl !== undefined) {
      fields.push('cover_url = ?');
      values.push(updates.coverUrl);
    }
    if (updates.releaseDate !== undefined) {
      fields.push('release_date = ?');
      values.push(updates.releaseDate);
    }
    if (updates.upc !== undefined) {
      fields.push('upc = ?');
      values.push(updates.upc);
    }
    if (updates.locgLink !== undefined) {
      fields.push('locg_link = ?');
      values.push(updates.locgLink);
    }
    if (updates.plot !== undefined) {
      fields.push('plot = ?');
      values.push(updates.plot);
    }

    if (fields.length === 0) {
      return existingIssue; // No updates to apply
    }

    values.push(id); // Add ID for WHERE clause
    const stmt = db.prepare(`UPDATE issues SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return this.getById(id);
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM issues WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export class WishlistService {
  static getAll(): WishlistItem[] {
    const stmt = db.prepare(`
      SELECT w.*, s.name as series_name, p.name as publisher_name 
      FROM wishlist w 
      JOIN wishlist_series s ON w.series_id = s.id 
      JOIN wishlist_publishers p ON w.publisher_id = p.id 
      ORDER BY s.name, w.issue_no
    `);
    return stmt.all().map((row: any) => ({
      id: row.id,
      name: row.name,
      seriesId: row.series_id,
      issueNo: row.issue_no,
      publisherId: row.publisher_id,
      variantDescription: row.variant_description,
      coverUrl: row.cover_url,
      releaseDate: row.release_date,
      upc: row.upc,
      locgLink: row.locg_link,
      plot: row.plot,
      createdAt: row.created_at,
      seriesName: row.series_name,
      publisherName: row.publisher_name,
    }));
  }

  static create(item: Omit<WishlistItem, 'id' | 'createdAt' | 'seriesName' | 'publisherName'>): WishlistItem {
    const stmt = db.prepare(`
      INSERT INTO wishlist (name, series_id, issue_no, publisher_id, variant_description, cover_url, release_date, upc, locg_link, plot) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      item.name,
      item.seriesId,
      item.issueNo,
      item.publisherId,
      item.variantDescription,
      item.coverUrl,
      item.releaseDate,
      item.upc,
      item.locgLink,
      item.plot
    );
    const newItem = db.prepare(`
      SELECT w.*, s.name as series_name, p.name as publisher_name 
      FROM wishlist w 
      JOIN wishlist_series s ON w.series_id = s.id 
      JOIN wishlist_publishers p ON w.publisher_id = p.id 
      WHERE w.id = ?
    `).get(result.lastInsertRowid) as any;
    
    return {
      id: newItem.id,
      name: newItem.name,
      seriesId: newItem.series_id,
      issueNo: newItem.issue_no,
      publisherId: newItem.publisher_id,
      variantDescription: newItem.variant_description,
      coverUrl: newItem.cover_url,
      releaseDate: newItem.release_date,
      upc: newItem.upc,
      locgLink: newItem.locg_link,
      plot: newItem.plot,
      createdAt: newItem.created_at,
      seriesName: newItem.series_name,
      publisherName: newItem.publisher_name,
    };
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM wishlist WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

// Legacy service for backward compatibility
export class ComicService {
  static getAllSeries(): ComicSeries[] {
    const stmt = db.prepare(`
      SELECT s.*, COUNT(i.id) as issue_count 
      FROM comic_series s 
      LEFT JOIN comic_issues i ON s.id = i.series_id 
      GROUP BY s.id 
      ORDER BY s.title
    `);
    
    return stmt.all().map((row: any) => ({
      // Base Series properties
      id: row.id,
      name: row.title || row.name,
      publisherId: row.publisher_id || 0,
      totalIssues: row.issue_count || 0,
      locgLink: row.locg_link,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      publisherName: row.publisher,
      // ComicSeries extensions
      title: row.title,
      issueCount: row.issue_count || 0,
      publisher: row.publisher,
    }));
  }

  static getSeriesById(id: number): ComicWithIssues | null {
    const seriesStmt = db.prepare(`
      SELECT s.*, p.name as publisher_name 
      FROM series s 
      JOIN publishers p ON s.publisher_id = p.id 
      WHERE s.id = ?
    `);
    const series = seriesStmt.get(id) as any;
    
    if (!series) return null;

    const issuesStmt = db.prepare(`
      SELECT i.*, p.name as publisher_name, s.name as series_name 
      FROM issues i 
      JOIN series s ON i.series_id = s.id 
      JOIN publishers p ON i.publisher_id = p.id 
      WHERE i.series_id = ? 
      ORDER BY i.issue_no
    `);
    const issues = issuesStmt.all(id).map((row: any) => ({
      id: row.id,
      seriesId: row.series_id,
      issueNumber: row.issue_no,
      title: row.name,
      releaseDate: row.release_date,
      coverImage: row.cover_url,
      upc: row.upc,
      variant: !!row.variant_description,
      variantDescription: row.variant_description,
      locgLink: row.locg_link,
      createdAt: row.created_at,
      seriesName: row.series_name,
      publisherName: row.publisher_name,
    }));

    // Calculate missing issues
    const missingIssues: number[] = [];
    if (series.total_issues > 0) {
      const ownedIssueNumbers = issues.map(issue => Math.floor(issue.issueNumber));
      const uniqueOwnedNumbers = [...new Set(ownedIssueNumbers)];
      
      for (let i = 1; i <= series.total_issues; i++) {
        if (!uniqueOwnedNumbers.includes(i)) {
          missingIssues.push(i);
        }
      }
    }

    return {
      id: series.id,
      name: series.name,
      title: series.name, // For compatibility
      publisherId: series.publisher_id,
      totalIssues: series.total_issues,
      issueCount: issues.length, // Actual count from collection
      publisher: series.publisher_name,
      publisherName: series.publisher_name,
      locgLink: series.locg_link,
      locgIssueCount: series.locg_issue_count,
      lastCrawled: series.last_crawled,
      createdAt: series.created_at,
      issues,
      missingIssues,
    } as unknown as ComicWithIssues;
  }

  static createSeries(series: any): ComicSeries {
    const stmt = db.prepare(`
      INSERT INTO comic_series (title, publisher, start_year, end_year, cover_image, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      series.title,
      series.publisher,
      series.startYear,
      series.endYear,
      series.coverImage,
      series.description
    );

    const newSeries = db.prepare('SELECT * FROM comic_series WHERE id = ?').get(result.lastInsertRowid) as any;
    
    return {
      // Base Series properties
      id: newSeries.id,
      name: newSeries.title,
      publisherId: newSeries.publisher_id || 0,
      totalIssues: 0,
      locgLink: newSeries.locg_link,
      startDate: newSeries.start_date,
      endDate: newSeries.end_date,
      createdAt: newSeries.created_at,
      publisherName: newSeries.publisher,
      // ComicSeries extensions
      title: newSeries.title,
      issueCount: 0,
      publisher: newSeries.publisher,
    } as unknown as ComicSeries;
  }

  static createIssue(issue: any): ComicIssue {
    const stmt = db.prepare(`
      INSERT INTO comic_issues (
        series_id, issue_number, title, release_date, cover_date, cover_image,
        description, rating, isbn, upc, price, page_count, writers, artists,
        colorists, letterers, editors, variant, in_collection
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      issue.seriesId,
      issue.issueNumber,
      issue.title,
      issue.releaseDate,
      issue.coverDate,
      issue.coverImage,
      issue.description,
      issue.rating,
      issue.isbn,
      issue.upc,
      issue.price,
      issue.pageCount,
      issue.writers,
      issue.artists,
      issue.colorists,
      issue.letterers,
      issue.editors,
      issue.variant ? 1 : 0,
      issue.inCollection ? 1 : 0
    );

    const newIssue = db.prepare('SELECT * FROM comic_issues WHERE id = ?').get(result.lastInsertRowid) as any;
    
    return {
      // Base Issue properties  
      id: newIssue.id,
      name: newIssue.title || newIssue.name,
      seriesId: newIssue.series_id,
      issueNo: newIssue.issue_number,
      publisherId: newIssue.publisher_id || 0,
      variantDescription: newIssue.variant_description,
      coverUrl: newIssue.cover_url || newIssue.cover_image,
      releaseDate: newIssue.release_date,
      upc: newIssue.upc,
      locgLink: newIssue.locg_link,
      plot: newIssue.plot || newIssue.description,
      createdAt: newIssue.created_at,
      // ComicIssue extensions
      issueNumber: newIssue.issue_number,
      title: newIssue.title,
    } as unknown as ComicIssue;
  }

  static searchSeries(query: string): ComicSeries[] {
    const stmt = db.prepare(`
      SELECT s.*, COUNT(i.id) as issue_count 
      FROM comic_series s 
      LEFT JOIN comic_issues i ON s.id = i.series_id 
      WHERE s.title LIKE ? OR s.publisher LIKE ?
      GROUP BY s.id 
      ORDER BY s.title
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm).map((row: any) => ({
      // Base Series properties
      id: row.id,
      name: row.title || row.name,
      publisherId: row.publisher_id || 0,
      totalIssues: row.issue_count || 0,
      locgLink: row.locg_link,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      publisherName: row.publisher,
      // ComicSeries extensions
      title: row.title,
      issueCount: row.issue_count || 0,
      publisher: row.publisher,
    } as unknown as ComicSeries));
  }
}

export class WishlistPublisherService {
  static getAll(): Publisher[] {
    const stmt = db.prepare('SELECT * FROM wishlist_publishers ORDER BY name');
    return stmt.all().map((row: any) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));
  }

  static getById(id: number): Publisher | null {
    const stmt = db.prepare('SELECT * FROM wishlist_publishers WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    } : null;
  }

  static create(name: string): Publisher {
    const stmt = db.prepare('INSERT INTO wishlist_publishers (name) VALUES (?)');
    const result = stmt.run(name);
    const newPublisher = db.prepare('SELECT * FROM wishlist_publishers WHERE id = ?').get(result.lastInsertRowid) as any;
    return {
      id: newPublisher.id,
      name: newPublisher.name,
      createdAt: newPublisher.created_at,
    };
  }

  static findOrCreate(name: string): Publisher {
    const existing = db.prepare('SELECT * FROM wishlist_publishers WHERE name = ?').get(name) as any;
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        createdAt: existing.created_at,
      };
    }
    return this.create(name);
  }
}

export class WishlistSeriesService {
  static getAll(): Series[] {
    const stmt = db.prepare(`
      SELECT s.*, p.name as publisher_name 
      FROM wishlist_series s 
      JOIN wishlist_publishers p ON s.publisher_id = p.id 
      ORDER BY s.name
    `);
    return stmt.all().map((row: any) => ({
      id: row.id,
      name: row.name,
      publisherId: row.publisher_id,
      totalIssues: row.total_issues,
      locgLink: row.locg_link,
      createdAt: row.created_at,
      publisherName: row.publisher_name,
    }));
  }

  static getById(id: number): Series | null {
    const stmt = db.prepare(`
      SELECT s.*, p.name as publisher_name 
      FROM wishlist_series s 
      JOIN wishlist_publishers p ON s.publisher_id = p.id 
      WHERE s.id = ?
    `);
    const row = stmt.get(id) as any;
    return row ? {
      id: row.id,
      name: row.name,
      publisherId: row.publisher_id,
      totalIssues: row.total_issues,
      locgLink: row.locg_link,
      createdAt: row.created_at,
      publisherName: row.publisher_name,
    } : null;
  }

  static create(series: Omit<Series, 'id' | 'createdAt' | 'publisherName'>): Series {
    const stmt = db.prepare(`
      INSERT INTO wishlist_series (name, publisher_id, total_issues, locg_link) 
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(series.name, series.publisherId, series.totalIssues, series.locgLink);
    const newSeries = db.prepare(`
      SELECT s.*, p.name as publisher_name 
      FROM wishlist_series s 
      JOIN wishlist_publishers p ON s.publisher_id = p.id 
      WHERE s.id = ?
    `).get(result.lastInsertRowid) as any;
    
    return {
      id: newSeries.id,
      name: newSeries.name,
      publisherId: newSeries.publisher_id,
      totalIssues: newSeries.total_issues,
      locgLink: newSeries.locg_link,
      createdAt: newSeries.created_at,
      publisherName: newSeries.publisher_name,
    };
  }

  static findOrCreate(name: string, publisherId: number, totalIssues: number = 0, locgLink?: string): Series {
    const existing = db.prepare('SELECT * FROM wishlist_series WHERE name = ? AND publisher_id = ?').get(name, publisherId) as any;
    if (existing) {
      const publisher = db.prepare('SELECT name FROM wishlist_publishers WHERE id = ?').get(publisherId) as any;
      return {
        id: existing.id,
        name: existing.name,
        publisherId: existing.publisher_id,
        totalIssues: existing.total_issues,
        locgLink: existing.locg_link,
        createdAt: existing.created_at,
        publisherName: publisher?.name,
      };
    }
    return this.create({ name, publisherId, totalIssues, locgLink });
  }

  static update(id: number, updates: Partial<Omit<Series, 'id' | 'createdAt' | 'publisherName'>>): Series {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.publisherId !== undefined) {
      fields.push('publisher_id = ?');
      values.push(updates.publisherId);
    }
    if (updates.totalIssues !== undefined) {
      fields.push('total_issues = ?');
      values.push(updates.totalIssues);
    }
    if (updates.locgLink !== undefined) {
      fields.push('locg_link = ?');
      values.push(updates.locgLink);
    }
    
    values.push(id);
    
    const stmt = db.prepare(`UPDATE wishlist_series SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return this.getById(id)!;
  }
}

export class TransferService {
  static moveWishlistItemToCollection(wishlistItemId: number): { success: boolean; error?: string; newIssueId?: number } {
    try {
      // Start transaction
      const transaction = db.transaction(() => {
        // Step 1: Get wishlist item data
        const wishlistItem = db.prepare(`
          SELECT w.*, s.name as series_name, p.name as publisher_name 
          FROM wishlist w 
          JOIN wishlist_series s ON w.series_id = s.id 
          JOIN wishlist_publishers p ON w.publisher_id = p.id 
          WHERE w.id = ?
        `).get(wishlistItemId) as any;

        if (!wishlistItem) {
          throw new Error('Wishlist item not found');
        }

        // Step 2: Smart publisher mapping
        let collectionPublisher = PublisherService.findOrCreate(wishlistItem.publisher_name);
        
        // Step 3: Smart series mapping
        let collectionSeries = SeriesService.findOrCreate(
          wishlistItem.series_name, 
          collectionPublisher.id, 
          wishlistItem.locg_link
        );

        // Step 4: Check for duplicate issue in collection
        const existingIssue = db.prepare(`
          SELECT id FROM issues 
          WHERE series_id = ? AND issue_no = ? AND variant_description = ?
        `).get(collectionSeries.id, wishlistItem.issue_no, wishlistItem.variant_description || null) as any;

        if (existingIssue) {
          throw new Error(`Issue #${wishlistItem.issue_no}${wishlistItem.variant_description ? ` (${wishlistItem.variant_description})` : ''} already exists in your collection`);
        }

        // Step 5: Create collection issue
        const newIssue = IssueService.create({
          name: wishlistItem.name,
          seriesId: collectionSeries.id,
          issueNo: wishlistItem.issue_no,
          publisherId: collectionPublisher.id,
          variantDescription: wishlistItem.variant_description,
          coverUrl: wishlistItem.cover_url,
          releaseDate: wishlistItem.release_date,
          upc: wishlistItem.upc,
          locgLink: wishlistItem.locg_link,
        });

        // Step 6: Remove from wishlist
        const deleted = WishlistService.delete(wishlistItemId);
        if (!deleted) {
          throw new Error('Failed to remove item from wishlist');
        }

        return newIssue.id;
      });

      const newIssueId = transaction();
      
      return { 
        success: true, 
        newIssueId: newIssueId 
      };

    } catch (error) {
      console.error('Error transferring wishlist item to collection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  static batchMoveWishlistItemsToCollection(wishlistItemIds: number[]): { 
    success: boolean; 
    results: Array<{ id: number; success: boolean; error?: string; newIssueId?: number }>;
    summary: { transferred: number; failed: number; };
  } {
    const results = [];
    let transferred = 0;
    let failed = 0;

    for (const itemId of wishlistItemIds) {
      const result = this.moveWishlistItemToCollection(itemId);
      results.push({
        id: itemId,
        ...result
      });
      
      if (result.success) {
        transferred++;
      } else {
        failed++;
      }
    }

    return {
      success: failed === 0,
      results,
      summary: { transferred, failed }
    };
  }
}