import { NextRequest, NextResponse } from 'next/server';
import { SeriesService, PublisherService } from '@/lib/db-service';
import { Series } from '@/types/comic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { series: seriesToSync, collectionType } = body;

    if (!seriesToSync || !Array.isArray(seriesToSync)) {
      return NextResponse.json(
        { success: false, error: 'Invalid series data provided' },
        { status: 400 }
      );
    }

    const results = {
      success: true,
      summary: {
        seriesCreated: 0,
        seriesUpdated: 0,
        errors: 0
      },
      details: {
        created: [] as Series[],
        updated: [] as Series[],
        errors: [] as any[]
      }
    };

    // Get existing series for comparison
    const existingSeries = SeriesService.getAll();
    const existingSeriesMap = new Map(existingSeries.map(s => [s.name, s]));

    for (const seriesData of seriesToSync) {
      try {
        const seriesName = seriesData.title || seriesData.name || 'Unknown Series';

        const existingSeries = existingSeriesMap.get(seriesName);
        
        if (existingSeries) {
          // Update existing series
          const publisherName = seriesData.publisher || seriesData.publisherName || existingSeries.publisherName;
          const publisher = PublisherService.findOrCreate(publisherName);
          
          const updatedSeries = SeriesService.update(existingSeries.id, {
            name: seriesName,
            publisherId: publisher.id,
            totalIssues: seriesData.totalIssues || existingSeries.totalIssues,
            locgLink: seriesData.locgLink || existingSeries.locgLink,
            startDate: seriesData.startDate || existingSeries.startDate,
            endDate: seriesData.endDate || existingSeries.endDate
          });
          
          if (updatedSeries) {
            results.summary.seriesUpdated++;
            results.details.updated.push(updatedSeries);
          } else {
            results.summary.errors++;
            results.details.errors.push({
              series: seriesData,
              error: 'Failed to update series'
            });
          }
        } else {
          // Create new series
          const publisherName = seriesData.publisher || seriesData.publisherName || 'Unknown';
          const publisher = PublisherService.findOrCreate(publisherName);
          
          const newSeries = SeriesService.create({
            name: seriesName,
            publisherId: publisher.id,
            totalIssues: seriesData.totalIssues || 0,
            locgLink: seriesData.locgLink,
            startDate: seriesData.startDate,
            endDate: seriesData.endDate
          });
          
          if (newSeries) {
            results.summary.seriesCreated++;
            results.details.created.push(newSeries);
          } else {
            results.summary.errors++;
            results.details.errors.push({
              series: seriesData,
              error: 'Failed to create series'
            });
          }
        }
      } catch (error) {
        results.summary.errors++;
        results.details.errors.push({
          series: seriesData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in series sync API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}