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
        !item.name.includes(',') && // Avoid items with commas in name (indicates CSV parsing issues)
        item.seriesName !== 'Unknown Series' &&
        item.publisherName !== 'Unknown Publisher'
      );
    } catch (error) {
      console.error('Error fetching items for template:', error);
      items = [];
    }
    
    // CSV headers
    const headers = [
      'name',
      'series_name', 
      'publisher_name',
      'issue_no',
      'variant_description',
      'cover_url',
      'release_date',
      'upc',
      'locg_link'
    ];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add sample rows if we have existing data
    if (items.length > 0) {
      // Add first few existing items as examples (commented out)
      items.slice(0, 3).forEach(item => {
        const row = [
          `"${item.name}"`,
          `"${item.seriesName}"`,
          `"${item.publisherName}"`,
          item.issueNo,
          item.variantDescription ? `"${item.variantDescription}"` : '',
          item.coverUrl ? `"${item.coverUrl}"` : '',
          item.releaseDate ? `"${item.releaseDate}"` : '',
          item.upc ? `"${item.upc}"` : '',
          item.locgLink ? `"${item.locgLink}"` : ''
        ];
        csvContent += `# ${row.join(',')}\n`;
      });
    }
    
    // Add empty rows for user to fill in
    csvContent += '\n# Remove the # from the lines above to use as examples\n';
    csvContent += `# Add your ${isWishlist ? 'wishlist items' : 'comic issues'} below this line:\n`;
    
    if (isWishlist) {
      csvContent += '"Amazing Spider-Man #1","Amazing Spider-Man","Marvel Comics",1,"","","2024-01-15","",""\n';
      csvContent += '"Batman #1","Batman","DC Comics",1,"Variant Cover","","2024-01-20","",""\n';
      csvContent += '"Saga #1","Saga","Image Comics",1,"","","2024-01-25","",""\n';
    } else {
      csvContent += '"Example Comic #1","Example Series","Marvel Comics",1,"","","2024-01-15","",""\n';
      csvContent += '"Example Comic #2","Another Series","DC Comics",1,"Variant Cover","","2024-01-20","",""\n';
    }
    
    const filename = isWishlist ? 'wishlist_import_template.csv' : 'comics_import_template.csv';
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}