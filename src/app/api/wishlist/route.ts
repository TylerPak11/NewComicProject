import { NextRequest, NextResponse } from 'next/server';
import { WishlistService } from '@/lib/db-service';

export async function GET(request: NextRequest) {
  try {
    const wishlistItems = WishlistService.getAll();
    
    // Transform to match the comic format for the UI
    const transformedItems = wishlistItems.map(item => ({
      id: item.id.toString(),
      series: item.seriesName || 'Unknown Series',
      issue: item.issueNo,
      publisher: item.publisherName || 'Unknown Publisher',
      year: new Date(item.releaseDate || item.createdAt).getFullYear(),
      coverUrl: item.coverUrl,
      variantDescription: item.variantDescription,
      releaseDate: item.releaseDate,
      upc: item.upc,
      locgLink: item.locgLink,
      plot: item.plot,
    }));
    
    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newItem = WishlistService.create(body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating wishlist item:', error);
    return NextResponse.json({ error: 'Failed to create wishlist item' }, { status: 500 });
  }
}

