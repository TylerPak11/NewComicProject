// Database adapter to switch between SQLite (local/Electron) and Prisma (Vercel)
import { Publisher, Series, Issue, WishlistItem } from '@/types/comic'

// Determine if we're running in production/Vercel or local development
const usePostgreSQL = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.NODE_ENV === 'production'

// Dynamic imports to avoid bundling unused code
let sqliteServices: any = null
let prismaServices: any = null

// Lazy load services based on environment
async function getServices() {
  if (usePostgreSQL) {
    if (!prismaServices) {
      const module = await import('./prisma-db-service')
      prismaServices = {
        PublisherService: module.PublisherService,
        SeriesService: module.SeriesService,
        IssueService: module.IssueService,
        WishlistService: module.WishlistService,
        ComicService: module.ComicService,
      }
    }
    return prismaServices
  } else {
    if (!sqliteServices) {
      const module = await import('./db-service')
      sqliteServices = {
        PublisherService: module.PublisherService,
        SeriesService: module.SeriesService,
        IssueService: module.IssueService,
        WishlistService: module.WishlistService,
        ComicService: module.ComicService,
      }
    }
    return sqliteServices
  }
}

// Unified Database Service Adapter
export class DatabaseAdapter {
  static async getPublisherService() {
    const services = await getServices()
    return services.PublisherService
  }

  static async getSeriesService() {
    const services = await getServices()
    return services.SeriesService
  }

  static async getIssueService() {
    const services = await getServices()
    return services.IssueService
  }

  static async getWishlistService() {
    const services = await getServices()
    return services.WishlistService
  }

  static async getComicService() {
    const services = await getServices()
    return services.ComicService
  }

  // Helper method to check which database is being used
  static isUsingPostgreSQL(): boolean {
    return !!usePostgreSQL
  }

  static isUsingSQLite(): boolean {
    return !usePostgreSQL
  }
}

// Re-export common interfaces
export type { Publisher, Series, Issue, WishlistItem }

// Environment info helper
export function getDatabaseInfo() {
  return {
    database: usePostgreSQL ? 'PostgreSQL (Prisma)' : 'SQLite',
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    hasPostgresUrl: !!(process.env.POSTGRES_URL || process.env.DATABASE_URL),
    isVercel: !!process.env.VERCEL,
    isElectron: !!process.env.ELECTRON_BUILD
  }
}