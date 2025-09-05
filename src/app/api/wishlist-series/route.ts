import { NextRequest, NextResponse } from 'next/server';
import { WishlistSeriesService } from '@/lib/db-service';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const series = WishlistSeriesService.getAll();
    
    // Transform to match the frontend series format
    const transformedSeries = series.map(s => ({
      id: s.id,
      title: s.name,
      issueCount: 0, // Will be updated when we have wishlist items
      publisher: s.publisherName || 'Unknown',
      publisherId: s.publisherId,
      name: s.name,
      totalIssues: s.totalIssues,
      locgLink: s.locgLink,
      createdAt: s.createdAt,
    }));
    
    return NextResponse.json(transformedSeries);
  } catch (error) {
    console.error('Error fetching wishlist series:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist series' }, { status: 500 });
  }
}