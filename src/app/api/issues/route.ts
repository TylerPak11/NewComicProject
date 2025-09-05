import { NextRequest, NextResponse } from 'next/server';
import { IssueService, PublisherService, SeriesService } from '@/lib/db-service';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const issues = IssueService.getAll();
    
    // Transform to match the expected format for the UI
    const transformedIssues = issues.map(issue => ({
      id: issue.id.toString(),
      series: issue.seriesName || 'Unknown Series',
      issue: issue.issueNo,
      publisher: issue.publisherName || 'Unknown Publisher',
      year: issue.releaseDate ? new Date(issue.releaseDate).getFullYear() : 2024,
      upc: issue.upc,
      releaseDate: issue.releaseDate,
      variantDescription: issue.variantDescription,
      coverUrl: issue.coverUrl,
      locgLink: issue.locgLink,
      plot: issue.plot
    }));
    
    return NextResponse.json(transformedIssues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If publisherName is provided, find or create the publisher
    let publisherId = body.publisherId;
    if (body.publisherName && !publisherId) {
      const publisher = PublisherService.findOrCreate(body.publisherName);
      publisherId = publisher.id;
    }
    
    // If seriesName is provided, find or create the series
    let seriesId = body.seriesId;
    if (body.seriesName && !seriesId && publisherId) {
      const series = SeriesService.findOrCreate(body.seriesName, publisherId, body.locgLink);
      seriesId = series.id;
    }
    
    // Create the issue with resolved IDs
    const issueData = {
      ...body,
      publisherId,
      seriesId
    };
    
    const newIssue = IssueService.create(issueData);
    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}

