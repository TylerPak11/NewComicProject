import { NextRequest, NextResponse } from 'next/server';
import { PublisherService, SeriesService, IssueService, WishlistService, WishlistPublisherService, WishlistSeriesService } from '@/lib/db-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const collectionType = formData.get('collectionType') as string || 'comics';
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    const isWishlist = collectionType === 'wishlist';
    
    const jsonText = await file.text();
    console.log('Raw JSON text preview:', jsonText.substring(0, 500));
    
    let jsonData;
    try {
      jsonData = JSON.parse(jsonText);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format. Please check your file syntax.' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(jsonData)) {
      return NextResponse.json(
        { success: false, error: 'JSON must be an array of comic objects' },
        { status: 400 }
      );
    }
    
    if (jsonData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found in JSON file' },
        { status: 400 }
      );
    }
    
    // Filter out comment objects (those with _comment field)
    const dataRows = jsonData.filter(item => !item._comment);
    
    if (dataRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid data found in JSON file (only comment examples found)' },
        { status: 400 }
      );
    }
    
    console.log('Parsed JSON data:', dataRows.slice(0, 3));
    
    const results = {
      success: true,
      summary: {
        issuesAdded: 0,
        seriesCreated: 0,
        publishersCreated: 0,
        errors: 0
      },
      issues: [] as string[]
    };
    
    // Process each item
    for (let i = 0; i < dataRows.length; i++) {
      const item = dataRows[i];
      const rowNumber = i + 1;
      
      try {
        // Extract data from JSON object
        const issueData = {
          name: (item.name || '').toString().trim(),
          seriesName: (item.series_name || '').toString().trim(),
          publisherName: (item.publisher_name || '').toString().trim(),
          issueNo: parseFloat(item.issue_no || '1'),
          variantDescription: item.variant_description ? item.variant_description.toString().trim() : null,
          coverUrl: item.cover_url ? item.cover_url.toString().trim() : null,
          releaseDate: item.release_date ? item.release_date.toString().trim() : null,
          upc: item.upc ? item.upc.toString().trim() : null,
          locgLink: item.locg_link ? item.locg_link.toString().trim() : null,
        };
        
        // Set default values for missing fields
        if (!issueData.name) {
          issueData.name = issueData.seriesName ? `${issueData.seriesName} #${issueData.issueNo}` : 'Untitled';
        }
        if (!issueData.seriesName) {
          issueData.seriesName = 'Unknown Series';
        }
        if (!issueData.publisherName) {
          issueData.publisherName = 'Unknown Publisher';
        }
        
        if (isNaN(issueData.issueNo)) {
          results.issues.push(`Row ${rowNumber}: Invalid issue number`);
          results.summary.errors++;
          continue;
        }
        
        // Smart lookup and creation for publisher
        let publisher;
        if (isWishlist) {
          // Check regular publishers table first
          const regularPublishers = PublisherService.getAll();
          const existingRegularPublisher = regularPublishers.find(p => p.name.toLowerCase() === issueData.publisherName.toLowerCase());
          
          if (existingRegularPublisher) {
            // Found in regular table - create/find corresponding entry in wishlist table
            console.log(`Publisher found in regular table: ${issueData.publisherName}`);
            const wishlistPublishers = WishlistPublisherService.getAll();
            const publisherExisted = wishlistPublishers.some(p => p.name.toLowerCase() === issueData.publisherName.toLowerCase());
            try {
              console.log(`Creating/finding wishlist publisher: ${issueData.publisherName}`);
              publisher = WishlistPublisherService.findOrCreate(issueData.publisherName);
              console.log(`Wishlist publisher result:`, publisher);
              if (!publisherExisted) {
                results.summary.publishersCreated++;
              }
            } catch (error) {
              results.issues.push(`Row ${rowNumber}: Failed to create/find publisher: ${issueData.publisherName}`);
              results.summary.errors++;
              continue;
            }
          } else {
            // Create in wishlist publishers table if not found in regular table
            const wishlistPublishers = WishlistPublisherService.getAll();
            const publisherExisted = wishlistPublishers.some(p => p.name.toLowerCase() === issueData.publisherName.toLowerCase());
            try {
              publisher = WishlistPublisherService.findOrCreate(issueData.publisherName);
              if (!publisherExisted) {
                results.summary.publishersCreated++;
              }
            } catch (error) {
              results.issues.push(`Row ${rowNumber}: Failed to create/find publisher: ${issueData.publisherName}`);
              results.summary.errors++;
              continue;
            }
          }
        } else {
          // Regular comics import logic
          const allPublishers = PublisherService.getAll();
          const publisherExisted = allPublishers.some(p => p.name.toLowerCase() === issueData.publisherName.toLowerCase());
          try {
            publisher = PublisherService.findOrCreate(issueData.publisherName);
            if (!publisherExisted) {
              results.summary.publishersCreated++;
            }
          } catch (error) {
            results.issues.push(`Row ${rowNumber}: Failed to create/find publisher: ${issueData.publisherName}`);
            results.summary.errors++;
            continue;
          }
        }
        
        // Smart lookup and creation for series
        let series;
        if (isWishlist) {
          // Check regular series table first
          const regularPublishers = PublisherService.getAll();
          const regularPublisher = regularPublishers.find(p => p.name.toLowerCase() === issueData.publisherName.toLowerCase());
          
          let foundInRegular = false;
          if (regularPublisher) {
            const regularSeries = SeriesService.getAll();
            const existingRegularSeries = regularSeries.find(s => 
              s.name.toLowerCase() === issueData.seriesName.toLowerCase() && 
              s.publisherId === regularPublisher.id
            );
            
            if (existingRegularSeries) {
              foundInRegular = true;
            }
          }
          
          // Always create/find in wishlist series table (using wishlist publisher ID)
          const wishlistSeries = WishlistSeriesService.getAll();
          const seriesExisted = wishlistSeries.some(s => 
            s.name.toLowerCase() === issueData.seriesName.toLowerCase() && 
            s.publisherId === publisher.id
          );
          
          try {
            console.log(`Creating/finding wishlist series: ${issueData.seriesName} with publisher ID: ${publisher.id}`);
            series = WishlistSeriesService.findOrCreate(issueData.seriesName, publisher.id, 0, issueData.locgLink);
            console.log(`Wishlist series result:`, series);
            if (!seriesExisted) {
              results.summary.seriesCreated++;
            }
          } catch (error) {
            results.issues.push(`Row ${rowNumber}: Failed to create/find series: ${issueData.seriesName}`);
            results.summary.errors++;
            continue;
          }
        } else {
          // Regular comics import logic
          const allSeries = SeriesService.getAll();
          const existingSeries = allSeries.find(s => 
            s.name.toLowerCase() === issueData.seriesName.toLowerCase() && 
            s.publisherId === publisher.id
          );
          const seriesExisted = !!existingSeries;
          
          try {
            series = SeriesService.findOrCreate(issueData.seriesName, publisher.id, issueData.locgLink);
            if (!seriesExisted) {
              results.summary.seriesCreated++;
            }
          } catch (error) {
            results.issues.push(`Row ${rowNumber}: Failed to create/find series: ${issueData.seriesName}`);
            results.summary.errors++;
            continue;
          }
        }
        
        // Create the issue (always import, no duplicate checking)
        try {
          const IssueSvc = isWishlist ? WishlistService : IssueService;
          
          console.log(`Creating issue for row ${rowNumber}:`, {
            name: issueData.name,
            seriesId: series.id,
            issueNo: issueData.issueNo,
            publisherId: publisher.id,
            isWishlist,
            seriesTable: isWishlist ? 'wishlist_series' : 'series',
            publisherTable: isWishlist ? 'wishlist_publishers' : 'publishers'
          });
          
          IssueSvc.create({
            name: issueData.name,
            seriesId: series.id,
            issueNo: issueData.issueNo,
            publisherId: publisher.id,
            variantDescription: issueData.variantDescription,
            coverUrl: issueData.coverUrl,
            releaseDate: issueData.releaseDate,
            upc: issueData.upc,
            locgLink: issueData.locgLink,
          });
          results.summary.issuesAdded++;
        } catch (error) {
          console.error(`Error creating issue for row ${rowNumber}:`, error);
          results.issues.push(`Row ${rowNumber}: Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.summary.errors++;
        }
        
      } catch (error) {
        results.issues.push(`Row ${rowNumber}: Unexpected error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.summary.errors++;
      }
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Error processing JSON import:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process JSON import: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}