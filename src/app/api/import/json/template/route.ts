import { NextRequest, NextResponse } from 'next/server';
import { IssueService, WishlistService } from '@/lib/db-service';
import { Issue, WishlistItem } from '@/types/comic';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const collectionType = url.searchParams.get('collectionType') || 'comics';
    const isWishlist = collectionType === 'wishlist';
    
    // Get existing data to populate template with sample data
    let items: (Issue | WishlistItem)[] = [];
    try {
      items = isWishlist ? WishlistService.getAll() : IssueService.getAll();
      // Filter out any corrupted items that might have malformed data
      items = items.filter(item => 
        item.name && 
        item.seriesName && 
        item.publisherName && 
        item.seriesName !== 'Unknown Series' &&
        item.publisherName !== 'Unknown Publisher'
      );
    } catch (error) {
      console.error('Error fetching items for JSON template:', error);
      items = [];
    }
    
    // Create JSON template array
    const jsonTemplate = [];
    
    // Add sample rows if we have existing data (commented examples)
    if (items.length > 0) {
      items.slice(0, 3).forEach(item => {
        jsonTemplate.push({
          _comment: `Example from your existing ${isWishlist ? 'wishlist' : 'collection'} - remove this _comment field to import`,
          name: item.name,
          series_name: item.seriesName,
          publisher_name: item.publisherName,
          issue_no: item.issueNo,
          variant_description: item.variantDescription || '',
          cover_url: item.coverUrl || '',
          release_date: item.releaseDate || '',
          upc: item.upc || '',
          locg_link: item.locgLink || ''
        });
      });
    }
    
    // Add empty template examples for user to fill in
    if (isWishlist) {
      jsonTemplate.push(
        {
          name: 'Amazing Spider-Man #1',
          series_name: 'Amazing Spider-Man',
          publisher_name: 'Marvel Comics',
          issue_no: 1,
          variant_description: '',
          cover_url: '',
          release_date: '2024-01-15',
          upc: '',
          locg_link: ''
        },
        {
          name: 'Batman #1',
          series_name: 'Batman',
          publisher_name: 'DC Comics',
          issue_no: 1,
          variant_description: 'Variant Cover',
          cover_url: '',
          release_date: '2024-01-20',
          upc: '',
          locg_link: ''
        },
        {
          name: 'Saga #1',
          series_name: 'Saga',
          publisher_name: 'Image Comics',
          issue_no: 1,
          variant_description: '',
          cover_url: '',
          release_date: '2024-01-25',
          upc: '',
          locg_link: ''
        }
      );
    } else {
      jsonTemplate.push(
        {
          name: 'Example Comic #1',
          series_name: 'Example Series',
          publisher_name: 'Marvel Comics',
          issue_no: 1,
          variant_description: '',
          cover_url: '',
          release_date: '2024-01-15',
          upc: '',
          locg_link: ''
        },
        {
          name: 'Example Comic #2',
          series_name: 'Another Series',
          publisher_name: 'DC Comics',
          issue_no: 1,
          variant_description: 'Variant Cover',
          cover_url: '',
          release_date: '2024-01-20',
          upc: '',
          locg_link: ''
        }
      );
    }
    
    const filename = isWishlist ? 'wishlist_import_template.json' : 'comics_import_template.json';
    
    return new NextResponse(JSON.stringify(jsonTemplate, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating JSON template:', error);
    return NextResponse.json(
      { error: 'Failed to generate JSON template' },
      { status: 500 }
    );
  }
}