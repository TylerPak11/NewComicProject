import { NextRequest, NextResponse } from 'next/server';
import { ComicService, IssueService, WishlistService } from '@/lib/db-service';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Parse the ID - it might be "regular-123" or "wishlist-456" or "combined-123-456"
    let regularSeriesId: number | null = null;
    let wishlistSeriesId: number | null = null;
    
    if (id.startsWith('regular-')) {
      regularSeriesId = parseInt(id.replace('regular-', ''));
    } else if (id.startsWith('wishlist-')) {
      wishlistSeriesId = parseInt(id.replace('wishlist-', ''));
    } else if (id.startsWith('combined-')) {
      const parts = id.replace('combined-', '').split('-');
      if (parts[0] !== 'null') regularSeriesId = parseInt(parts[0]);
      if (parts[1] !== 'null') wishlistSeriesId = parseInt(parts[1]);
    } else {
      // Legacy - assume it's a regular series ID first, then try wishlist
      regularSeriesId = parseInt(id);
    }
    
    let seriesData = null;
    let collectionIssues: any[] = [];
    let wishlistItems: any[] = [];
    let missingIssues: number[] = [];
    
    // Get collection data if regular series exists
    if (regularSeriesId) {
      const comicWithIssues = ComicService.getSeriesById(regularSeriesId);
      if (comicWithIssues) {
        seriesData = comicWithIssues;
        collectionIssues = comicWithIssues.issues || [];
        missingIssues = comicWithIssues.missingIssues || [];
      }
    }
    
    // Get wishlist data if wishlist series exists
    if (wishlistSeriesId) {
      const wishlistSeriesItems = WishlistService.getAll().filter(item => item.seriesId === wishlistSeriesId);
      wishlistItems = wishlistSeriesItems.map(item => ({
        id: item.id,
        name: item.name,
        issueNumber: item.issueNo,
        issueNo: item.issueNo,
        variantDescription: item.variantDescription,
        coverUrl: item.coverUrl,
        coverImage: item.coverUrl,
        releaseDate: item.releaseDate,
        upc: item.upc,
        locgLink: item.locgLink,
        createdAt: item.createdAt,
        seriesName: item.seriesName,
        publisherName: item.publisherName,
        type: 'wishlist'
      }));
      
      // If we don't have series data from collection, create it from wishlist
      if (!seriesData && wishlistItems.length > 0) {
        const firstItem = wishlistItems[0];
        seriesData = {
          id: wishlistSeriesId,
          name: firstItem.seriesName,
          title: firstItem.seriesName,
          publisher: firstItem.publisherName,
          publisherName: firstItem.publisherName,
          totalIssues: 0, // Unknown for wishlist-only series
          issueCount: 0,
          issues: [],
          missingIssues: [],
          type: 'wishlist-only'
        };
      }
    }
    
    // If we have series data but no wishlist series ID, try to find wishlist items by series name and publisher
    if (seriesData && !wishlistSeriesId) {
      const allWishlistItems = WishlistService.getAll();
      const matchingWishlistItems = allWishlistItems.filter(item => 
        item.seriesName === seriesData.name && 
        item.publisherName === (seriesData.publisherName || seriesData.publisher)
      );
      
      if (matchingWishlistItems.length > 0) {
        wishlistItems = matchingWishlistItems.map(item => ({
          id: item.id,
          name: item.name,
          issueNumber: item.issueNo,
          issueNo: item.issueNo,
          variantDescription: item.variantDescription,
          coverUrl: item.coverUrl,
          coverImage: item.coverUrl,
          releaseDate: item.releaseDate,
          upc: item.upc,
          locgLink: item.locgLink,
          createdAt: item.createdAt,
          seriesName: item.seriesName,
          publisherName: item.publisherName,
          type: 'wishlist'
        }));
      }
    }
    
    if (!seriesData) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }
    
    // Combine all issues and mark their types
    const allIssues = [
      ...collectionIssues.map(issue => ({ ...issue, type: 'collection' })),
      ...wishlistItems.map(item => ({ ...item, type: 'wishlist' }))
    ].sort((a, b) => a.issueNumber - b.issueNumber);
    
    const combinedData = {
      ...seriesData,
      collectionIssues,
      wishlistItems,
      allIssues,
      missingIssues,
      stats: {
        collectionCount: collectionIssues.length,
        wishlistCount: wishlistItems.length,
        missingCount: missingIssues.length,
        totalCount: collectionIssues.length + wishlistItems.length
      }
    };
    
    return NextResponse.json(combinedData);
  } catch (error) {
    console.error('Error fetching combined series details:', error);
    return NextResponse.json({ error: 'Failed to fetch series details' }, { status: 500 });
  }
}