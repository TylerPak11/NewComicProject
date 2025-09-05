import { NextRequest, NextResponse } from 'next/server';
import { IssueService, SeriesService, PublisherService } from '@/lib/db-service';
import { Issue } from '@/types/comic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issues: issuesToSync, collectionType } = body;

    if (!issuesToSync || !Array.isArray(issuesToSync)) {
      return NextResponse.json(
        { success: false, error: 'Invalid issues data provided' },
        { status: 400 }
      );
    }

    const results = {
      success: true,
      summary: {
        issuesCreated: 0,
        issuesUpdated: 0,
        errors: 0
      },
      details: {
        created: [] as Issue[],
        updated: [] as Issue[],
        errors: [] as any[]
      }
    };

    // Get existing issues for comparison
    const existingIssues = IssueService.getAll();
    const existingIssuesMap = new Map(
      existingIssues.map(issue => [`${issue.seriesName}-${issue.issueNo}`, issue])
    );

    for (const issueData of issuesToSync) {
      try {
        const seriesName = issueData.series || issueData.seriesName || 'Unknown Series';
        const issueNumber = issueData.issue || issueData.issueNo || 0;

        const issueKey = `${seriesName}-${issueNumber}`;
        const existingIssue = existingIssuesMap.get(issueKey);
        
        // Get or create publisher and series
        const publisherName = issueData.publisher || issueData.publisherName || 'Unknown';
        const publisher = PublisherService.findOrCreate(publisherName);
        const series = SeriesService.findOrCreate(seriesName, publisher.id);

        if (existingIssue) {
          // Update existing issue
          const updatedIssue = IssueService.update(existingIssue.id, {
            name: issueData.name || existingIssue.name,
            seriesId: series.id,
            issueNo: parseFloat(issueNumber.toString()),
            publisherId: publisher.id,
            variantDescription: issueData.variantDescription || existingIssue.variantDescription,
            coverUrl: issueData.coverUrl || existingIssue.coverUrl,
            releaseDate: issueData.releaseDate || existingIssue.releaseDate,
            upc: issueData.upc || existingIssue.upc,
            locgLink: issueData.locgLink || existingIssue.locgLink
          });
          
          if (updatedIssue) {
            results.summary.issuesUpdated++;
            results.details.updated.push(updatedIssue);
          } else {
            results.summary.errors++;
            results.details.errors.push({
              issue: issueData,
              error: 'Failed to update issue'
            });
          }
        } else {
          // Create new issue
          const newIssue = IssueService.create({
            name: issueData.name || `${seriesName} #${issueNumber}`,
            seriesId: series.id,
            issueNo: parseFloat(issueNumber.toString()),
            publisherId: publisher.id,
            variantDescription: issueData.variantDescription,
            coverUrl: issueData.coverUrl,
            releaseDate: issueData.releaseDate,
            upc: issueData.upc,
            locgLink: issueData.locgLink
          });
          
          if (newIssue) {
            results.summary.issuesCreated++;
            results.details.created.push(newIssue);
          } else {
            results.summary.errors++;
            results.details.errors.push({
              issue: issueData,
              error: 'Failed to create issue'
            });
          }
        }
      } catch (error) {
        results.summary.errors++;
        results.details.errors.push({
          issue: issueData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in issues sync API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}