import { NextRequest, NextResponse } from 'next/server';
import { PublisherService, SeriesService, IssueService, WishlistService, WishlistPublisherService, WishlistSeriesService } from '@/lib/db-service';

// Simple CSV parser with improved error handling
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    row.push(current.trim().replace(/^"|"$/g, ''));
    
    // More flexible column validation - allow as few as 2 columns (series_name + publisher_name minimum)
    if (row.length >= 2 && row.length <= 12) {
      // Pad with empty strings to ensure we have at least 9 columns for consistent indexing
      while (row.length < 9) {
        row.push('');
      }
      result.push(row);
    } else {
      console.warn(`Skipping malformed CSV row with ${row.length} columns:`, row);
    }
  }
  
  return result;
}

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
    
    const csvText = await file.text();
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found in CSV file' },
        { status: 400 }
      );
    }
    
    // Assuming first row is headers
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // No required headers - all fields are optional
    
    // Get header indexes
    const headerIndexes = {
      name: headers.indexOf('name'),
      series_name: headers.indexOf('series_name'),
      publisher_name: headers.indexOf('publisher_name'),
      issue_no: headers.indexOf('issue_no'),
      variant_description: headers.indexOf('variant_description'),
      cover_url: headers.indexOf('cover_url'),
      release_date: headers.indexOf('release_date'),
      upc: headers.indexOf('upc'),
      locg_link: headers.indexOf('locg_link'),
    };
    
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
    
    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 because we skipped header and arrays are 0-indexed
      
      try {
        // Extract data from row
        const issueData = {
          name: row[headerIndexes.name]?.replace(/^"|"$/g, '') || '',
          seriesName: row[headerIndexes.series_name]?.replace(/^"|"$/g, '') || '',
          publisherName: row[headerIndexes.publisher_name]?.replace(/^"|"$/g, '') || '',
          issueNo: parseFloat(row[headerIndexes.issue_no] || '1'),
          variantDescription: row[headerIndexes.variant_description]?.replace(/^"|"$/g, '') || null,
          coverUrl: row[headerIndexes.cover_url]?.replace(/^"|"$/g, '') || null,
          releaseDate: row[headerIndexes.release_date]?.replace(/^"|"$/g, '') || null,
          upc: row[headerIndexes.upc]?.replace(/^"|"$/g, '') || null,
          locgLink: row[headerIndexes.locg_link]?.replace(/^"|"$/g, '') || null,
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
            series = WishlistSeriesService.findOrCreate(issueData.seriesName, publisher.id, 0, issueData.locgLink || undefined);
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
            series = SeriesService.findOrCreate(issueData.seriesName, publisher.id, issueData.locgLink || undefined);
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
            variantDescription: issueData.variantDescription || undefined,
            coverUrl: issueData.coverUrl || undefined,
            releaseDate: issueData.releaseDate || undefined,
            upc: issueData.upc || undefined,
            locgLink: issueData.locgLink || undefined,
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
    console.error('Error processing import:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process import: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}