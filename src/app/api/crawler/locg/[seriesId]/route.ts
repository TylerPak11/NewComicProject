import { NextRequest, NextResponse } from 'next/server';
import { SeriesService } from '@/lib/db-service';
import LOCGCrawler from '@/lib/locg-crawler';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;
    const id = parseInt(seriesId);
    
    // Get credentials from request body
    const body = await request.json().catch(() => ({}));
    const credentials = body.credentials;
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid series ID' }, { status: 400 });
    }

    // Get the series
    const series = SeriesService.getById(id);
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    if (!series.locgLink) {
      // If no LOCG link, create a search URL
      const searchQuery = encodeURIComponent(`${series.name} ${series.publisherName || ''}`);
      const searchUrl = `https://leagueofcomicgeeks.com/search?keyword=${searchQuery}`;
      
      console.log(`No LOCG link found for series ${id}. Will search: ${searchUrl}`);
      
      // Use the search URL instead
      const searchResult = await LOCGCrawler.crawlSeries(searchUrl, credentials);
      
      if (searchResult.success) {
        const updatedSeries = SeriesService.updateLocgIssueCount(
          id, 
          searchResult.issueCount || 0, 
          searchResult.crawledAt,
          searchResult.run
        );

        return NextResponse.json({
          success: true,
          seriesId: id,
          seriesName: series.name,
          issueCount: searchResult.issueCount,
          regularIssues: searchResult.regularIssues || 0,
          annuals: searchResult.annuals || 0,
          run: searchResult.run,
          crawledAt: searchResult.crawledAt,
          series: updatedSeries,
          note: 'Crawled from search results - you may need to manually verify the series'
        });
      } else {
        return NextResponse.json({
          success: false,
          seriesId: id,
          seriesName: series.name,
          error: `Search failed: ${searchResult.error}`,
          searchUrl,
          note: 'Try manually finding the series on LOCG and adding the direct link'
        }, { status: 500 });
      }
    }

    console.log(`Starting crawl for series ${id}: ${series.name}`);

    // Initialize crawler
    await LOCGCrawler.initialize();

    // Crawl the series
    const result = await LOCGCrawler.crawlSeries(series.locgLink, credentials);

    if (result.success && result.issueCount !== undefined) {
      // Update the database with the crawled count
      const updatedSeries = SeriesService.updateLocgIssueCount(
        id, 
        result.issueCount, 
        result.crawledAt,
        result.run
      );

      console.log(`Crawl successful for series ${id}: found ${result.issueCount} issues`);

      return NextResponse.json({
        success: true,
        seriesId: id,
        seriesName: series.name,
        issueCount: result.issueCount,
        regularIssues: result.regularIssues || 0,
        annuals: result.annuals || 0,
        run: result.run,
        crawledAt: result.crawledAt,
        series: updatedSeries
      });
    } else {
      console.error(`Crawl failed for series ${id}:`, result.error);
      
      return NextResponse.json({
        success: false,
        seriesId: id,
        seriesName: series.name,
        error: result.error,
        url: result.url
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in crawler API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    // Don't clean up crawler resources - leave browser open for inspection
    // User should manually close the browser window when done
    console.log('Crawler finished - browser window left open for inspection');
  }
}