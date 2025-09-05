import { NextRequest, NextResponse } from 'next/server';
import { PublisherService, SeriesService, IssueService } from '@/lib/db-service';

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
    
    console.log('Parsed JSON data:', jsonData.slice(0, 3));
    
    // Filter out comment objects (those with _comment field)
    const dataRows = jsonData.filter(item => !item._comment);
    
    if (dataRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid data found in JSON file (only comment examples found)' },
        { status: 400 }
      );
    }
    
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
    console.error('Error validating JSON import:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate JSON import: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}