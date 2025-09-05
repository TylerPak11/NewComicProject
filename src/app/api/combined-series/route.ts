import { NextRequest, NextResponse } from 'next/server';
import { SeriesService, WishlistSeriesService, PublisherService, WishlistPublisherService } from '@/lib/db-service';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get all regular series and wishlist series
    const regularSeries = SeriesService.getAll();
    const wishlistSeries = WishlistSeriesService.getAll();
    
    // Create a map to combine series by name and publisher
    const combinedSeriesMap = new Map<string, any>();
    
    // Add regular series to the map
    regularSeries.forEach(series => {
      const key = `${series.name.toLowerCase()}-${series.publisherName?.toLowerCase()}`;
      combinedSeriesMap.set(key, {
        id: series.id,
        name: series.name,
        title: series.name,
        publisher: series.publisherName,
        publisherId: series.publisherId,
        totalIssues: series.totalIssues,
        issueCount: 0, // Will be calculated
        locgLink: series.locgLink,
        createdAt: series.createdAt,
        type: 'regular', // Indicates this series exists in regular collection
        wishlistId: null,
        wishlistCount: 0
      });
    });
    
    // Add or update with wishlist series
    wishlistSeries.forEach(series => {
      const key = `${series.name.toLowerCase()}-${series.publisherName?.toLowerCase()}`;
      if (combinedSeriesMap.has(key)) {
        // Series exists in both - update with wishlist info
        const existing = combinedSeriesMap.get(key);
        existing.wishlistId = series.id;
        existing.wishlistCount = 0; // Will be calculated
      } else {
        // Series only exists in wishlist
        combinedSeriesMap.set(key, {
          id: null, // No regular series ID
          wishlistId: series.id,
          name: series.name,
          title: series.name,
          publisher: series.publisherName,
          publisherId: series.publisherId,
          totalIssues: series.totalIssues,
          issueCount: 0,
          wishlistCount: 0,
          locgLink: series.locgLink,
          createdAt: series.createdAt,
          type: 'wishlist-only'
        });
      }
    });
    
    // Convert map to array
    const combinedSeries = Array.from(combinedSeriesMap.values());
    
    return NextResponse.json(combinedSeries);
  } catch (error) {
    console.error('Error fetching combined series:', error);
    return NextResponse.json({ error: 'Failed to fetch combined series' }, { status: 500 });
  }
}