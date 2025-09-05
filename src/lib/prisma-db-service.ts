import { prisma } from './prisma-db'
import type { Publisher, Series, Issue, WishlistItem } from '@/types/comic'

export class PublisherService {
  static async getAll(): Promise<Publisher[]> {
    const publishers = await prisma.publisher.findMany({
      orderBy: { name: 'asc' }
    })
    
    return publishers.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt.toISOString()
    }))
  }

  static async getById(id: number): Promise<Publisher | null> {
    const publisher = await prisma.publisher.findUnique({
      where: { id }
    })
    
    return publisher ? {
      id: publisher.id,
      name: publisher.name,
      createdAt: publisher.createdAt.toISOString()
    } : null
  }

  static async create(name: string): Promise<Publisher> {
    const publisher = await prisma.publisher.create({
      data: { name }
    })
    
    return {
      id: publisher.id,
      name: publisher.name,
      createdAt: publisher.createdAt.toISOString()
    }
  }

  static async findOrCreate(name: string): Promise<Publisher> {
    const existing = await prisma.publisher.findUnique({
      where: { name }
    })
    
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        createdAt: existing.createdAt.toISOString()
      }
    }
    
    return this.create(name)
  }

  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.publisher.delete({
        where: { id }
      })
      return true
    } catch {
      return false
    }
  }
}

export class SeriesService {
  static async getAll(): Promise<Series[]> {
    const series = await prisma.series.findMany({
      include: {
        publisher: true
      },
      orderBy: { name: 'asc' }
    })
    
    return series.map(s => ({
      id: s.id,
      name: s.name,
      publisherId: s.publisherId,
      totalIssues: s.totalIssues,
      locgLink: s.locgLink || undefined,
      locgIssueCount: s.locgIssueCount || undefined,
      lastCrawled: s.lastCrawled?.toISOString(),
      startDate: s.startDate || undefined,
      endDate: s.endDate || undefined,
      run: s.run || undefined,
      createdAt: s.createdAt.toISOString(),
      publisherName: s.publisher.name
    }))
  }

  static async getById(id: number): Promise<Series | null> {
    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        publisher: true
      }
    })
    
    return series ? {
      id: series.id,
      name: series.name,
      publisherId: series.publisherId,
      totalIssues: series.totalIssues,
      locgLink: series.locgLink || undefined,
      locgIssueCount: series.locgIssueCount || undefined,
      lastCrawled: series.lastCrawled?.toISOString(),
      startDate: series.startDate || undefined,
      endDate: series.endDate || undefined,
      run: series.run || undefined,
      createdAt: series.createdAt.toISOString(),
      publisherName: series.publisher.name
    } : null
  }

  static async create(series: Omit<Series, 'id' | 'createdAt' | 'publisherName'>): Promise<Series> {
    const created = await prisma.series.create({
      data: {
        name: series.name,
        publisherId: series.publisherId,
        totalIssues: series.totalIssues,
        locgLink: series.locgLink || null,
        locgIssueCount: series.locgIssueCount || null,
        lastCrawled: series.lastCrawled ? new Date(series.lastCrawled) : null,
        startDate: series.startDate || null,
        endDate: series.endDate || null,
        run: series.run || null
      },
      include: {
        publisher: true
      }
    })
    
    return {
      id: created.id,
      name: created.name,
      publisherId: created.publisherId,
      totalIssues: created.totalIssues,
      locgLink: created.locgLink || undefined,
      locgIssueCount: created.locgIssueCount || undefined,
      lastCrawled: created.lastCrawled?.toISOString(),
      startDate: created.startDate || undefined,
      endDate: created.endDate || undefined,
      run: created.run || undefined,
      createdAt: created.createdAt.toISOString(),
      publisherName: created.publisher.name
    }
  }

  static async update(id: number, updates: Partial<Omit<Series, 'id' | 'createdAt' | 'publisherName'>>): Promise<Series | null> {
    try {
      const updated = await prisma.series.update({
        where: { id },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.publisherId !== undefined && { publisherId: updates.publisherId }),
          ...(updates.totalIssues !== undefined && { totalIssues: updates.totalIssues }),
          ...(updates.locgLink !== undefined && { locgLink: updates.locgLink }),
          ...(updates.locgIssueCount !== undefined && { locgIssueCount: updates.locgIssueCount }),
          ...(updates.lastCrawled !== undefined && { 
            lastCrawled: updates.lastCrawled ? new Date(updates.lastCrawled) : null 
          }),
          ...(updates.startDate !== undefined && { startDate: updates.startDate }),
          ...(updates.endDate !== undefined && { endDate: updates.endDate }),
          ...(updates.run !== undefined && { run: updates.run })
        },
        include: {
          publisher: true
        }
      })
      
      return {
        id: updated.id,
        name: updated.name,
        publisherId: updated.publisherId,
        totalIssues: updated.totalIssues,
        locgLink: updated.locgLink || undefined,
        locgIssueCount: updated.locgIssueCount || undefined,
        lastCrawled: updated.lastCrawled?.toISOString(),
        startDate: updated.startDate || undefined,
        endDate: updated.endDate || undefined,
        run: updated.run || undefined,
        createdAt: updated.createdAt.toISOString(),
        publisherName: updated.publisher.name
      }
    } catch {
      return null
    }
  }

  static async findOrCreate(name: string, publisherId: number, locgLink?: string): Promise<Series> {
    const existing = await prisma.series.findFirst({
      where: {
        name,
        publisherId
      },
      include: {
        publisher: true
      }
    })
    
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        publisherId: existing.publisherId,
        totalIssues: existing.totalIssues,
        locgLink: existing.locgLink || undefined,
        locgIssueCount: existing.locgIssueCount || undefined,
        lastCrawled: existing.lastCrawled?.toISOString(),
        startDate: existing.startDate || undefined,
        endDate: existing.endDate || undefined,
        run: existing.run || undefined,
        createdAt: existing.createdAt.toISOString(),
        publisherName: existing.publisher.name
      }
    }
    
    return this.create({
      name,
      publisherId,
      totalIssues: 0,
      locgLink
    })
  }

  static async updateLocgIssueCount(id: number, count: number, timestamp: string, run?: string): Promise<Series | null> {
    return this.update(id, {
      locgIssueCount: count,
      lastCrawled: timestamp,
      run
    })
  }

  static async getSeriesWithLocgLinks(): Promise<Series[]> {
    const series = await prisma.series.findMany({
      where: {
        locgLink: {
          not: null
        }
      },
      include: {
        publisher: true
      },
      orderBy: { name: 'asc' }
    })
    
    return series.map(s => ({
      id: s.id,
      name: s.name,
      publisherId: s.publisherId,
      totalIssues: s.totalIssues,
      locgLink: s.locgLink || undefined,
      locgIssueCount: s.locgIssueCount || undefined,
      lastCrawled: s.lastCrawled?.toISOString(),
      startDate: s.startDate || undefined,
      endDate: s.endDate || undefined,
      run: s.run || undefined,
      createdAt: s.createdAt.toISOString(),
      publisherName: s.publisher.name
    }))
  }

  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.series.delete({
        where: { id }
      })
      return true
    } catch {
      return false
    }
  }
}

export class IssueService {
  static async getAll(): Promise<Issue[]> {
    const issues = await prisma.issue.findMany({
      include: {
        series: true,
        publisher: true
      },
      orderBy: [
        { seriesId: 'asc' },
        { issueNo: 'asc' }
      ]
    })
    
    return issues.map(i => ({
      id: i.id,
      name: i.name,
      seriesId: i.seriesId,
      issueNo: i.issueNo,
      publisherId: i.publisherId,
      variantDescription: i.variantDescription,
      coverUrl: i.coverUrl,
      releaseDate: i.releaseDate,
      upc: i.upc,
      locgLink: i.locgLink,
      plot: i.plot,
      createdAt: i.createdAt.toISOString(),
      seriesName: i.series.name,
      publisherName: i.publisher.name
    }))
  }

  static async getById(id: number): Promise<Issue | null> {
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        series: true,
        publisher: true
      }
    })
    
    return issue ? {
      id: issue.id,
      name: issue.name,
      seriesId: issue.seriesId,
      issueNo: issue.issueNo,
      publisherId: issue.publisherId,
      variantDescription: issue.variantDescription,
      coverUrl: issue.coverUrl,
      releaseDate: issue.releaseDate,
      upc: issue.upc,
      locgLink: issue.locgLink,
      plot: issue.plot,
      createdAt: issue.createdAt.toISOString(),
      seriesName: issue.series.name,
      publisherName: issue.publisher.name
    } : null
  }

  static async getBySeriesId(seriesId: number): Promise<Issue[]> {
    const issues = await prisma.issue.findMany({
      where: { seriesId },
      include: {
        series: true,
        publisher: true
      },
      orderBy: { issueNo: 'asc' }
    })
    
    return issues.map(i => ({
      id: i.id,
      name: i.name,
      seriesId: i.seriesId,
      issueNo: i.issueNo,
      publisherId: i.publisherId,
      variantDescription: i.variantDescription,
      coverUrl: i.coverUrl,
      releaseDate: i.releaseDate,
      upc: i.upc,
      locgLink: i.locgLink,
      plot: i.plot,
      createdAt: i.createdAt.toISOString(),
      seriesName: i.series.name,
      publisherName: i.publisher.name
    }))
  }

  static async create(issue: Omit<Issue, 'id' | 'createdAt' | 'seriesName' | 'publisherName'>): Promise<Issue> {
    const created = await prisma.issue.create({
      data: {
        name: issue.name,
        seriesId: issue.seriesId,
        issueNo: issue.issueNo,
        publisherId: issue.publisherId,
        variantDescription: issue.variantDescription,
        coverUrl: issue.coverUrl,
        releaseDate: issue.releaseDate,
        upc: issue.upc,
        locgLink: issue.locgLink,
        plot: issue.plot
      },
      include: {
        series: true,
        publisher: true
      }
    })
    
    return {
      id: created.id,
      name: created.name,
      seriesId: created.seriesId,
      issueNo: created.issueNo,
      publisherId: created.publisherId,
      variantDescription: created.variantDescription,
      coverUrl: created.coverUrl,
      releaseDate: created.releaseDate,
      upc: created.upc,
      locgLink: created.locgLink,
      plot: created.plot,
      createdAt: created.createdAt.toISOString(),
      seriesName: created.series.name,
      publisherName: created.publisher.name
    }
  }

  static async update(id: number, updates: Partial<Omit<Issue, 'id' | 'createdAt' | 'seriesName' | 'publisherName'>>): Promise<Issue | null> {
    try {
      const updated = await prisma.issue.update({
        where: { id },
        data: updates,
        include: {
          series: true,
          publisher: true
        }
      })
      
      return {
        id: updated.id,
        name: updated.name,
        seriesId: updated.seriesId,
        issueNo: updated.issueNo,
        publisherId: updated.publisherId,
        variantDescription: updated.variantDescription,
        coverUrl: updated.coverUrl,
        releaseDate: updated.releaseDate,
        upc: updated.upc,
        locgLink: updated.locgLink,
        plot: updated.plot,
        createdAt: updated.createdAt.toISOString(),
        seriesName: updated.series.name,
        publisherName: updated.publisher.name
      }
    } catch {
      return null
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.issue.delete({
        where: { id }
      })
      return true
    } catch {
      return false
    }
  }
}

export class WishlistService {
  static async getAll(): Promise<WishlistItem[]> {
    const items = await prisma.wishlistItem.findMany({
      include: {
        series: true,
        publisher: true
      },
      orderBy: [
        { seriesId: 'asc' },
        { issueNo: 'asc' }
      ]
    })
    
    return items.map(i => ({
      id: i.id,
      name: i.name,
      seriesId: i.seriesId,
      issueNo: i.issueNo,
      publisherId: i.publisherId,
      variantDescription: i.variantDescription,
      coverUrl: i.coverUrl,
      releaseDate: i.releaseDate,
      upc: i.upc,
      locgLink: i.locgLink,
      plot: i.plot,
      createdAt: i.createdAt.toISOString(),
      seriesName: i.series.name,
      publisherName: i.publisher.name
    }))
  }

  static async getById(id: number): Promise<WishlistItem | null> {
    const item = await prisma.wishlistItem.findUnique({
      where: { id },
      include: {
        series: true,
        publisher: true
      }
    })
    
    return item ? {
      id: item.id,
      name: item.name,
      seriesId: item.seriesId,
      issueNo: item.issueNo,
      publisherId: item.publisherId,
      variantDescription: item.variantDescription,
      coverUrl: item.coverUrl,
      releaseDate: item.releaseDate,
      upc: item.upc,
      locgLink: item.locgLink,
      plot: item.plot,
      createdAt: item.createdAt.toISOString(),
      seriesName: item.series.name,
      publisherName: item.publisher.name
    } : null
  }

  static async create(item: Omit<WishlistItem, 'id' | 'createdAt' | 'seriesName' | 'publisherName'>): Promise<WishlistItem> {
    const created = await prisma.wishlistItem.create({
      data: {
        name: item.name,
        seriesId: item.seriesId,
        issueNo: item.issueNo,
        publisherId: item.publisherId,
        variantDescription: item.variantDescription,
        coverUrl: item.coverUrl,
        releaseDate: item.releaseDate,
        upc: item.upc,
        locgLink: item.locgLink,
        plot: item.plot
      },
      include: {
        series: true,
        publisher: true
      }
    })
    
    return {
      id: created.id,
      name: created.name,
      seriesId: created.seriesId,
      issueNo: created.issueNo,
      publisherId: created.publisherId,
      variantDescription: created.variantDescription,
      coverUrl: created.coverUrl,
      releaseDate: created.releaseDate,
      upc: created.upc,
      locgLink: created.locgLink,
      plot: created.plot,
      createdAt: created.createdAt.toISOString(),
      seriesName: created.series.name,
      publisherName: created.publisher.name
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.wishlistItem.delete({
        where: { id }
      })
      return true
    } catch {
      return false
    }
  }
}

// Combined services for series data from both collections and wishlists
export class ComicService {
  static async getSeriesById(id: number): Promise<any | null> {
    const series = await SeriesService.getById(id)
    if (!series) return null

    const issues = await IssueService.getBySeriesId(id)
    
    return {
      ...series,
      issues
    }
  }

  static async getAllCombinedSeries(): Promise<any[]> {
    const series = await SeriesService.getAll()
    const wishlistSeries = await prisma.wishlistSeries.findMany({
      include: {
        publisher: true
      }
    })
    
    // Convert wishlist series to same format
    const formattedWishlistSeries = wishlistSeries.map(s => ({
      id: s.id,
      name: s.name,
      publisherId: s.publisherId,
      totalIssues: s.totalIssues,
      locgLink: s.locgLink || undefined,
      locgIssueCount: s.locgIssueCount || undefined,
      lastCrawled: s.lastCrawled?.toISOString(),
      startDate: s.startDate || undefined,
      endDate: s.endDate || undefined,
      run: s.run || undefined,
      createdAt: s.createdAt.toISOString(),
      publisherName: s.publisher.name,
      type: 'wishlist' as const
    }))
    
    return [
      ...series.map(s => ({ ...s, type: 'collection' as const })),
      ...formattedWishlistSeries
    ]
  }
}