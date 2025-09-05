import { NextRequest, NextResponse } from 'next/server';
import { PublisherService, SeriesService, IssueService } from '@/lib/db-service';

// Simple CSV parser with improved error handling (reused from process route)
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
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    const csvText = await file.text();
    console.log('Raw CSV text preview:', csvText.substring(0, 500));
    const rows = parseCSV(csvText);
    console.log('Parsed rows:', rows.slice(0, 3));
    
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
    
    // Get existing data for validation
    const existingPublishers = PublisherService.getAll();
    const existingSeries = SeriesService.getAll();
    const existingIssues = IssueService.getAll();
    
    const validation = {
      success: true,
      summary: {
        totalRows: dataRows.length,
        validRows: 0,
        issuesWillBeAdded: 0,
        seriesWillBeCreated: 0,
        publishersWillBeCreated: 0,
        duplicates: 0,
        errors: 0
      },
      details: {
        newPublishers: [] as string[],
        newSeries: [] as { name: string, publisher: string }[],
        newIssues: [] as { name: string, series: string, issue: number, variant?: string }[],
        duplicates: [] as { name: string, series: string, issue: number, variant?: string }[],
        errors: [] as { row: number, message: string }[]
      }
    };
    
    const publishersToCreate = new Set<string>();
    const seriesToCreate = new Set<string>();
    
    // Process each row for validation
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
          validation.details.errors.push({
            row: rowNumber,
            message: 'Invalid issue number'
          });
          validation.summary.errors++;
          continue;
        }
        
        // Check if publisher exists or will be created
        const publisherExists = existingPublishers.some(p => 
          p.name.toLowerCase() === issueData.publisherName.toLowerCase()
        );
        if (!publisherExists && !publishersToCreate.has(issueData.publisherName)) {
          publishersToCreate.add(issueData.publisherName);
          validation.details.newPublishers.push(issueData.publisherName);
          validation.summary.publishersWillBeCreated++;
        }
        
        // Check if series exists or will be created
        const seriesKey = `${issueData.seriesName}|${issueData.publisherName}`;
        const seriesExists = existingSeries.some(s => 
          s.name.toLowerCase() === issueData.seriesName.toLowerCase() && 
          existingPublishers.find(p => p.id === s.publisherId)?.name.toLowerCase() === issueData.publisherName.toLowerCase()
        );
        if (!seriesExists && !seriesToCreate.has(seriesKey)) {
          seriesToCreate.add(seriesKey);
          validation.details.newSeries.push({
            name: issueData.seriesName,
            publisher: issueData.publisherName
          });
          validation.summary.seriesWillBeCreated++;
        }
        
        // Always accept issues (no duplicate checking)
        validation.details.newIssues.push({
          name: issueData.name,
          series: issueData.seriesName,
          issue: issueData.issueNo,
          variant: issueData.variantDescription || undefined
        });
        validation.summary.issuesWillBeAdded++;
        
        validation.summary.validRows++;
        
      } catch (error) {
        validation.details.errors.push({
          row: rowNumber,
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        validation.summary.errors++;
      }
    }
    
    return NextResponse.json(validation);
    
  } catch (error) {
    console.error('Error validating import:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate import: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}